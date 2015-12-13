window.onload = function(){
    var m = new matIV();
    var gl, c;
    var vb = null;
    var texture_vb = null;
    var vertex_color_vbo;
    var faces_ibo;
    var faces_ibo_count;
    var z0 = -13.0;
    var y0 = 8.0;
    var x0 = 0.0;
    var x1 = 0.0;
    var y1 = 8.0;
    var z1 = 0.0;
    var rad = [0.0, 0.0, 0.0];
    var textures;
    var gltexs = [];
    var material = [];
    var face_to_tex = [];
    var test_texture = null;
    var param = 0;
    var draws = [];

    function parse(buf) {
        var mybuf = new Buf(buf, 4);
        var pmx_version = mybuf.readf();
        console.log("pmx version:" + pmx_version);
        var header_length = mybuf.read8();
        var encoding = mybuf.read8();
        var appendix = mybuf.read8();
        var vertex_index_size = mybuf.read8();
        var texture_index_size = mybuf.read8();
        var material_index_size = mybuf.read8();
        var bone_index_size = mybuf.read8();
        var morph_index_size = mybuf.read8();
        var rigid_body_index_size = mybuf.read8();
        console.log("len:" + header_length + " enc:" + encoding + " appendix:" + appendix);
        console.log("ver:" + vertex_index_size + " tex:" + texture_index_size + " mat:" + material_index_size);
        console.log("bone:" + bone_index_size + " morph:" + morph_index_size + " rigid:" + rigid_body_index_size);
        // model info
        var model_name_local = mybuf.readstr();
        console.log("name:" + model_name_local);
        var model_name_eng = mybuf.readstr();
        var comment_local = mybuf.readstr();
        var comment_eng = mybuf.readstr();

        // vertex data
        console.log("start of vertex data: " + mybuf.pos.toString(16));
        var vertex_count = mybuf.read32();
        console.log("vertex count: " + vertex_count);

        vb = Array(vertex_count * 3);
        texture_vb = Array(vertex_count * 2);
        for(var i = 0; i < vertex_count; i++){
            //console.log("vertex "+i+":");
            var x = mybuf.readf();
            var y = mybuf.readf();
            var z = mybuf.readf();
            vb[i * 3 + 0] = x;
            vb[i * 3 + 1] = y;
            vb[i * 3 + 2] = z;
            // Normal
            var normal_x = mybuf.readf();
            var normal_y = mybuf.readf();
            var normal_z = mybuf.readf();
            //console.log("x,y,z:" + x + "," +y + "," + z);
            var uv_0 = mybuf.readf();
            var uv_1 = mybuf.readf();
            texture_vb[i * 2 + 0] = uv_0;
            texture_vb[i * 2 + 1] = uv_1;
            var weight_type = mybuf.read8();
            //console.log("wt:" + weight_type);

            if(weight_type == 0){
                var b1 = mybuf.readint(bone_index_size);
                //console.log("b1:" + b1);
            }else if(weight_type == 1){
                var b1 = mybuf.readint(bone_index_size);
                var b2 = mybuf.readint(bone_index_size);
                var w1 = mybuf.readf();
                //console.log("bdef2:" + b1 + " " + b2 + " w:" + w1);
            }else if(weight_type == 2){
                // bdef4
                var b1 = mybuf.readint(bone_index_size);
                var b2 = mybuf.readint(bone_index_size);
                var b3 = mybuf.readint(bone_index_size);
                var b4 = mybuf.readint(bone_index_size);
                var w1 = mybuf.readf();
                var w2 = mybuf.readf();
                var w3 = mybuf.readf();
                var w4 = mybuf.readf();
                //console.log("bdef4:" + b1 + ":" + w1 + " " + b2 + ":" + w2 + " " + b3 + ":" + w3 + " " + b4 + ":" + w4);
            }else{
                //console.log("wrong weight type:" + weight_type);
                break;
            }
            var edge_scale = mybuf.readf();
            //console.log("edge:" + edge_scale);
        }

        var face_count = mybuf.read32();
        var faces = Array(face_count);
        console.log("face count: " + face_count);
        for(var i = 0; i < face_count; i++){
            var v = mybuf.readint(vertex_index_size);
            faces[i] = v;
            //console.log("v:" + v);
        }
        faces_ibo = create_ibo(faces);
        faces_ibo_count = face_count;
        var tex_count = mybuf.read32();
        console.log("tex count: " + tex_count);
        textures = Array(tex_count);
        gltexs = Array(tex_count);
        for(var i = 0; i < tex_count; i++){
            draws[i] = 1;
            textures[i] = mybuf.readstr();
            //console.log("tex "+i+" " + s);
            var tex;
            var img = new Image();

            img.onload = (function(fix_i){
                return function(event){
                    var tex = gltexs[fix_i] = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, event.target);
                    gl.generateMipmap(gl.TEXTURE_2D);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    var found = false;
                    for(var k = 0; k < gltexs.length; k++){
                        if(gltexs[k] == null){
                            found = true;
                            break;
                        }
                    }
                    if(!found){
                        // all texture were loaded.
                        redraw();
                    }
                }
            })(i);
            img.src = './data/test1/' + textures[i];
        }
        var total_face_count_mat = 0;
        var mat_count = mybuf.read32();
        console.log("mat count: " + mat_count);
        for(var i = 0; i < mat_count; i++){
            var name = mybuf.readstr();
            var engname = mybuf.readstr();
            console.log("mat " + i + " " + name + " " + engname);
            var dif = Array(4);
            dif[0] = mybuf.readf();
            dif[1] = mybuf.readf();
            dif[2] = mybuf.readf();
            dif[3] = mybuf.readf();
            var spec = Array(3);
            spec[0] = mybuf.readf();
            spec[1] = mybuf.readf();
            spec[2] = mybuf.readf();
            var specularity = mybuf.readf();
            var amb = Array(3);
            amb[0] = mybuf.readf();
            amb[1] = mybuf.readf();
            amb[2] = mybuf.readf();
            var drmode = mybuf.read8();
            var edge = Array(3);
            edge[0] = mybuf.readf();
            edge[1] = mybuf.readf();
            edge[2] = mybuf.readf();
            var edgesize = mybuf.readf();
            var dummy = mybuf.readf();

            var texture_index = mybuf.readint(texture_index_size);
            var sp_index = mybuf.readint(texture_index_size);
            var a = mybuf.read8();
            var toon_flag = mybuf.read8();
            var toon;
            var toon_texture_index = -1;
            if(toon_flag){
                toon = mybuf.read8();
            }else{
                toon_texture_index = mybuf.readint(texture_index_size);
            }
            var memo = mybuf.readstr();
            var face_num = mybuf.read32();
            total_face_count_mat += face_num;
            console.log("mode:" + drmode +
                        " tex:" + (texture_index < 0 ? texture_index : textures[texture_index]) + " sp:" +
                            (sp_index < 0 ? sp_index : textures[sp_index]) +
                                " toon:" + (toon_texture_index < 0 ? toon_texture_index : textures[toon_texture_index]) + " face:" + face_num + " tot:" + total_face_count_mat);

            function t(c){
                function m(t){
                    t = parseInt(t*256);
                    if(t < 16){
                        return "0" + t.toString(16);
                    }
                    return t.toString(16);
                }
                return "#" + m(c[0]) + m(c[1]) + m(c[2]);
            }
            document.getElementById('col').innerHTML +=
                "<span color='" + t(dif) + "'>dif" + i + " </span>"+
                "<span color='" + t(spec) + "'>spe" + i + " </span>"+
                "<span color='" + t(amb) + "'>amb" + i + " </span>";

            material[i] = {face: face_num, texture_index: texture_index,
            sp_index: sp_index, toon_texture_index: toon_texture_index, toon: toon,
            name: name, current_face_index: total_face_count_mat - face_num,
            drmode: drmode};
            face_to_tex[face_num] = i;
        }
        loadcookie();
    }

    function load(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', './data/test1/a.pmx', true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
            parse(this.response);
            callback();
        };

        xhr.send();
    };

    function create_view_matrix(){
        var vMatrix = m.identity(m.create());
        m.lookAt([x0, y0, z0], [x1, y1, z1], [0, 1, 0], vMatrix);
        m.rotate(vMatrix, rad[0], [1, 0, 0], vMatrix);
        m.rotate(vMatrix, rad[1], [0, 1, 0], vMatrix);
        m.rotate(vMatrix, rad[2], [0, 0, 1], vMatrix);
        return vMatrix;
    }

    function create_mvp_matrix(mMatrix){
        var vMatrix = create_view_matrix();
        var pMatrix = m.identity(m.create());
        var mvpMatrix = m.create();
        m.perspective(90, c.width / c.height, 0.1, 1000, pMatrix);

        m.multiply(pMatrix, vMatrix, mvpMatrix);
        m.multiply(mvpMatrix, mMatrix, mvpMatrix);
        return mvpMatrix;
    }

    function draw_face(gl, c, prg, vbo, color_vbo, texture_vbo, ibo, ibo_count) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(attLocation[0]);
        gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
        gl.enableVertexAttribArray(attLocation[1]);
        gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, texture_vbo);
        gl.enableVertexAttribArray(attLocation[2]);
        gl.vertexAttribPointer(attLocation[2], attStride[2], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        gl.uniform1i(uniLocation[1], 0);

        var mMatrix = m.identity(m.create());
        gl.uniformMatrix4fv(uniLocation[0], false, create_mvp_matrix(mMatrix));

        var total_face = 0;
        for(var i = 0; i < material.length; i++){
            if(draws[i] == 0){
                continue;
            }
            gl.bindTexture(gl.TEXTURE_2D, gltexs[material[i].texture_index]);
            gl.drawElements(gl.TRIANGLES, material[i].face, gl.UNSIGNED_SHORT, material[i].current_face_index * 2);
        }

        gl.flush();
    }

    function draw(gl, c, prg, vbo, color_vbo, mode) {
        // attributeの要素数を配列に格納
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(attLocation[0]);
        gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
        gl.enableVertexAttribArray(attLocation[1]);
        gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0);

        var mMatrix = m.identity(m.create());
        gl.uniformMatrix4fv(uniLocation[0], false, create_mvp_matrix(mMatrix));

        if(mode == 1){
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }else{
            gl.drawArrays(gl.LINES, 0, 6);
        }

        gl.flush();
    }


    // VBOを生成する関数
    function create_vbo(data){
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    // IBOを生成する関数
    function create_ibo(data){
        var ibo = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    function create_program(vs, fs){
        var program = gl.createProgram();

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        gl.linkProgram(program);

        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
        }
    }

    function create_shader(id){
        var shader;

        var scriptElement = document.getElementById(id);

        if(!scriptElement){return;}

        switch(scriptElement.type){
            case 'x-shader/x-vertex':
            shader = gl.createShader(gl.VERTEX_SHADER);
            break;
            case 'x-shader/x-fragment':
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            break;
            default :
            return;
        }

        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
        }
    }

    function redraw(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //draw(gl, c, prg, vbo1, vbo_color, 1);
        draw(gl, c, prg, vbo2, vbo_grid_color, 0);
        if(vbo3){
            draw_face(gl, c, prg, vbo3, vbo_a_color, vbo_texture, faces_ibo, faces_ibo_count);
        }
        textcon.clearRect(0, 0, textcon.canvas.width, textcon.canvas.height);
        if(vb){
            textcon.fillStyle="#FFFFFF";
            textcon.fillRect(10, 20, 400, 30);
            textcon.fillStyle="#333333";
            textcon.fillText(sprintf("(%s,%s,%s) (%s,%s,%s) r=X, g=Y, y=Z Rad=%s,%s param:%s", x0, y0, z0, x1, y1, z1, rad[0].toFixed(3), rad[1].toFixed(3), param), 10, 30);
        }else{
            textcon.fillText("loading", 10, 100);
        }
    }

    textc = document.getElementById('text');
    textcon = textc.getContext('2d');
    c = document.getElementById('canvas');
    c.height = c.clientHeight;
    c.width = c.clientWidth;
    gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    gl.clearColor(0.0, 0.1, 0.1, 1.0);
    gl.clearDepth(1.0);

    var vs = create_shader('vs');
    var fs = create_shader('fs');
    var prg = create_program(vs, fs);

    var attLocation = new Array(2);
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');
    var attStride = new Array(2);
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    var uniLocation = new Array();
    uniLocation[0]  = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'texture');
    var testval = 0;

    gl.activeTexture(gl.TEXTURE0);

    var vertex_position = [
        0.0, 9.0, 0.0,
        9.0, 0.0, 0.0,
        -9.0, 0.0, 0.0,
        0.0, 0.0, -15.0,
        0.0, 9.0, 0.0,
        -9.0, 0.0, 0.0
    ];
    var colors = [
         0.8, 0.8, 0.8, 1.0,
         0.8, 0.8, 0.8, 1.0,
         0.8, 0.8, 0.8, 1.0,
         1.0, 0.0, 0.0, 1.0,
         0.0, 1.0, 0.0, 1.0,
         0.0, 0.0, 1.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         0.0, 1.0, 0.0, 1.0,
         0.0, 0.0, 1.0, 1.0,
    ];
    var grid_pos = [
        -100.0, 0.0, 0.0,
        100.0, 0.0, 0.0,
        0.0, -100.0, 0.0,
        0.0, 100.0, 0.0,
        0.0, 0.0, -100.0,
        0.0, 0.0, 100.0
    ];
    var grid_colors = [
         1.0, 0.0, 0.0, 1.0,
         1.0, 0.0, 0.0, 1.0,
         0.2, 0.5, 0.0, 1.0,
         0.2, 0.5, 0.0, 1.0,
         0.7, 0.7, 0.0, 1.0,
         0.7, 0.7, 0.0, 1.0
    ];
    var vbo1 = create_vbo(vertex_position);
    var vbo2 = create_vbo(grid_pos);
    var vbo_color = create_vbo(colors);
    var vbo_grid_color = create_vbo(grid_colors);
    var vbo_a_color;
    var test_image = new Image();
    test_image.onload = function(){
        test_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, test_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, test_image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    test_image.src = "./data/white.png";

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw(gl, c, prg, vbo1, vbo_color, 1);
    //setInterval(function(){
    //    redraw();
    //}, 1000);
    var vbo3;
    var vbo_texture;
    load(function(){
        var a_colors = Array(4 * vb.length / 3);
        for(var i = 0; i < a_colors.length; i+=12){
            for(var j = 0; j < 12; j+=1){
                a_colors[i+j] = colors[j];
            }
        }
        vbo_a_color = create_vbo(a_colors);
        var checksHtml = "";
        for(var i = 0; i < material.length; i++){
            var checked = draws[i] ? " checked" : "";
            checksHtml += sprintf("<div class=checkcon><input data-id='%s' type=checkbox id='check%s' class='checkboxes'%s><label for='check%s'>%s</label></div>",
                                  i, i, checked, i, material[i].name);
        }
        checksHtml += "<div class=checkcon></div>";
        document.getElementById('checks').innerHTML = checksHtml;
        document.onchange = function(event){
            var id = event.target.getAttribute('data-id');
            if(id == null){
                return;
            }
            if(event.target.checked){
                draws[id] = 1;
            }else{
                draws[id] = 0;
            }
            savecookie();
            redraw();
        };

        vbo3 = create_vbo(vb);
        vbo_texture = create_vbo(texture_vb);
        redraw();
    });
    function savecookie(){
        document.cookie = JSON.stringify(draws);
    }
    function loadcookie(){
        if(document.cookie != ""){
            draws = JSON.parse(document.cookie);
        }
    }
    //c.onclick = function(){
    //    testval += 1;
    //    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //    draw(gl, c, prg, vbo1, vbo_color, 1);
    //}
    function create_button(name, cb1, cb2){
        document.getElementById('bt_' + name + 'p').onclick = cb1;
        document.getElementById('bt_' + name + 'm').onclick = cb2;
    }

    create_button('x0', function(){x0 += 1;redraw();}, function(){x0 -= 1;redraw();});
    create_button('y0', function(){y0 += 1;redraw();}, function(){y0 -= 1;redraw();});
    create_button('z0', function(){z0 += 1;redraw();}, function(){z0 -= 1;redraw();});
    create_button('x1', function(){x1 += 1;redraw();}, function(){x1 -= 1;redraw();});
    create_button('y1', function(){y1 += 1;redraw();}, function(){y1 -= 1;redraw();});
    create_button('z1', function(){z1 += 1;redraw();}, function(){z1 -= 1;redraw();});
    create_button('p1', function(){param += 1;redraw();}, function(){param -= 1;redraw();});

    var dragging = false;
    var startx;
    var starty;
    var startrad;
    document.getElementById('container').onmousedown = function(e){
        dragging = true;
        startx = e.x;
        starty = e.y;
        startrad = [].concat(rad);
    };
    document.getElementById('container').onmouseup = function(){
        dragging = false;
    };
    document.onmousemove = function(e){
        if(dragging){
            //rad[0] = startrad[0] + (e.y - starty) / 50;
            rad[1] = startrad[1] + (e.x - startx) / 100;
            redraw();
        }
    };

    document.getElementById('container').ontouchstart = function(e){
        dragging = true;
        startx = e.changedTouches[0].pageX;
        starty = e.changedTouches[0].pageY;
        startrad = [].concat(rad);
    };
    document.getElementById('container').ontouchend = function(){
        dragging = false;
    };
    document.ontouchmove = function(e){
        if(dragging){
            //rad[0] = startrad[0] + (e.y - starty) / 50;
            rad[1] = startrad[1] + (e.changedTouches[0].pageX - startx) / 100;
            if(rad[1] > Math.PI * 2){
                rad[1] -= Math.PI * 2;
            }else if(rad[1] < 0){
                rad[1] += Math.PI * 2;
            }
            redraw();
        }
    };
};

function sprintf(){
    var template = arguments[0];
    for(var i = 1; i < arguments.length; i++){
        template = template.replace('%s', arguments[i]);
    }
    return template;
}

function read32(buf, pos) {
    var u = new Uint8Array(buf, pos, 4);
    return (u[0]) | (u[1] << 8 & 0xFF00) | (u[2] << 16 & 0xFF0000) | (u[3] << 24 & 0xFF000000);
}

function readstr(buf, pos) {
    var len = read32(buf, pos);
    var str = String.fromCharCode.apply(null, new Uint16Array(buf.slice(pos+4,pos+4+len)));
    return [str, pos];
}

var Buf = function(buf, pos) {
    this.buf = buf;
    this.pos = pos;
};

Buf.prototype = {
    readstr: function() {
        var len = this.read32();
        var str = String.fromCharCode.apply(null, new Uint16Array(this.buf.slice(this.pos,this.pos+len)));
        this.pos += len;
        return str;
    },
    read16: function() {
        var u = new Uint8Array(this.buf, this.pos, 2);
        this.pos += 2;
        var tmp = (u[0]) | (u[1] << 8 & 0xFF00);
        if(tmp >= (1 << 15)){
            return (1 << 16) - tmp;
        }
        return tmp;
    },
    read32: function() {
        var u = new Uint8Array(this.buf, this.pos, 4);
        this.pos += 4;
        return (u[0]) | (u[1] << 8 & 0xFF00) | (u[2] << 16 & 0xFF0000) | (u[3] << 24 & 0xFF000000);
    },
    readf: function() {
        var floatView = new Float32Array(this.buf.slice(this.pos, this.pos + 4));
        this.pos += 4;
        return floatView[0];
    },
    read8: function() {
        var u = new Int8Array(this.buf, this.pos, 1);
        this.pos++;
        return u[0];
    },
    readint: function(size) {
        if(size == 1){
            return this.read8();
        }else if(size == 2){
            return this.read16();
        }else if(size == 4){
            return this.read32();
        }
    },
};




