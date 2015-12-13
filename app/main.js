window.onload = function(){
    var m = new matIV();
    var gl, c;
    var vertexes = null;
    var vertex_normals = null;
    var vertex_normals_vbo = null;
    var texture_vb = null;
    var vertex_color_vbo;
    var faces_index;
    var faces_ibo;
    var faces_ibo_count;
    var edge_scales;
    var edge_scales_vbo;
    var z0 = -13.0;
    var y0 = 12.0;
    var x0 = 0.0;
    var x1 = 0.0;
    var y1 = 12.0;
    var z1 = 0.0;
    var rad = [0.0, 0.0, 0.0];
    var textures;
    var gltexs = [];
    var default_texture_list = ['toon0.bmp', 'toon01.bmp', 'toon02.bmp', 'toon03.bmp', 'toon04.bmp', 'toon05.bmp', 'toon06.bmp', 'toon07.bmp', 'toon08.bmp', 'toon09.bmp', 'toon10.bmp'];
    var gltexs_default = [];
    var material = [];
    var face_to_tex = [];
    var test_texture = null;
    var param = 0;
    var draws = [];
    var view_distance = 1;
    var basedir;
    var pmx_loaded = false;
    var doDraw = [1,1,1,1];

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

        vertexes = Array(vertex_count * 3);
        texture_vb = Array(vertex_count * 2);
        vertex_normals = Array(vertex_count * 3);
        edge_scales = Array(vertex_count);
        for(var i = 0; i < vertex_count; i++){
            //console.log("vertex "+i+":");
            var x = mybuf.readf();
            var y = mybuf.readf();
            var z = mybuf.readf();
            vertexes[i * 3 + 0] = x;
            vertexes[i * 3 + 1] = y;
            vertexes[i * 3 + 2] = z;
            // Normal
            var normal_x = mybuf.readf();
            var normal_y = mybuf.readf();
            var normal_z = mybuf.readf();
            vertex_normals[i * 3 + 0] = normal_x;
            vertex_normals[i * 3 + 1] = normal_y;
            vertex_normals[i * 3 + 2] = normal_z;
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
            }else if(weight_type == 3){
                // sdef
                var b1 = mybuf.readint(bone_index_size);
                var b2 = mybuf.readint(bone_index_size);
                var w1 = mybuf.readf();
                var c_0 = mybuf.readf();
                var c_1 = mybuf.readf();
                var c_2 = mybuf.readf();
                var r0_0 = mybuf.readf();
                var r0_1 = mybuf.readf();
                var r0_2 = mybuf.readf();
                var r1_0 = mybuf.readf();
                var r1_1 = mybuf.readf();
                var r1_2 = mybuf.readf();
            }else{
                //console.log("wrong weight type:" + weight_type);
                break;
            }
            var edge_scale = mybuf.readf();
            edge_scales[i] = edge_scale;
            //console.log("edge:" + edge_scale);
        }
        vertex_normals_vbo = create_vbo(vertex_normals);
        edge_scales_vbo = create_vbo(edge_scales);

        var face_count = mybuf.read32();
        faces_index = Array(face_count);
        console.log("start of face data: " + mybuf.pos.toString(16));
        console.log("face count: " + face_count);
        for(var i = 0; i < face_count; i++){
            var v = mybuf.readint(vertex_index_size);
            faces_index[i] = v;
            //console.log("v:" + v);
        }
        faces_ibo = create_ibo(faces_index);
        faces_ibo_count = face_count;
        var tex_count = mybuf.read32();
        console.log("tex count: " + tex_count);
        textures = Array(tex_count);
        gltexs = Array(tex_count);
        for(var i = 0; i < tex_count; i++){
            draws[i] = 1;
            textures[i] = mybuf.readstr();
            textures[i] = textures[i].replace(/\\/g, '/');
            textures[i] = textures[i].replace(/\.tga/, '.png');
            //console.log("tex "+i+" " + s);
            var tex;
            var img = new Image();

            img.onload = (function(fix_i){
                return function(event){
                    var tex = gltexs[fix_i] = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, event.target);
                    //gl.generateMipmap(gl.TEXTURE_2D);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
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
            img.src = basedir + textures[i];
        }
        var total_face_count_mat = 0;
        var mat_count = mybuf.read32();
        console.log("mat count: " + mat_count);
        for(var i = 0; i < mat_count; i++){
            var name = mybuf.readstr();
            var engname = mybuf.readstr();
            console.log("mat " + i + " " + name + " " + engname + " pos:" + mybuf.pos.toString(16));
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
            var edge_color = Array(3);
            edge_color[0] = mybuf.readf();
            edge_color[1] = mybuf.readf();
            edge_color[2] = mybuf.readf();
            var edgesize = mybuf.readf();
            var dummy = mybuf.readf();

            var texture_index = mybuf.readint(texture_index_size);
            var sp_index = mybuf.readint(texture_index_size);
            var env_mode = mybuf.read8();
            var toon_flag = mybuf.read8();
            var toon = -1;
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
                                " env:" + env_mode + 
                                " toon:" + (toon_texture_index < 0 ? toon_texture_index : textures[toon_texture_index]) + " toon2:" + toon + " face:" + face_num + " tot:" + total_face_count_mat +
                                    " (" + (total_face_count_mat - face_num) + ", " + total_face_count_mat+")"
                       );
            console.log("no-cull:" + (drmode & 1 ? 1 : 0) + " gshadow:" + (drmode & 2 ? 1 : 0) +
                        " drawshadow:" + (drmode & 4 ? 1 : 0) + " rec:" + (drmode & 8 ? 1 : 0) +
                        " edge:" + (drmode & 16 ? 1 : 0) + " vcol:" + (drmode & 32 ? 1 : 0) +
                        " point:" + (drmode & 64 ? 1 : 0) + " line:" + (drmode & 128 ? 1 : 0));

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
            sp_index: sp_index, env_mode: env_mode, toon_texture_index: toon_texture_index, toon: toon, toon_flag: toon_flag,
            name: name, current_face_index: total_face_count_mat - face_num,
            drmode: drmode, edge_size: edgesize, edge_color: edge_color};
            face_to_tex[face_num] = i;
        }

        // bone data
        var bone_count = mybuf.read32();
        for(var i = 0; i < bone_count; i++){
            var bone_local_name = mybuf.readstr();
            var bone_end_name = mybuf.readstr();
            //console.log("bone " + i + " " + bone_local_name + " eng:" + bone_end_name);

            var b0 = mybuf.readf();
            var b1 = mybuf.readf();
            var b2 = mybuf.readf();
            var parent_bone_index = mybuf.readint(bone_index_size);
            var trans_level = mybuf.read32();
            var bone_flag = mybuf.read16();
            //console.log("flag:" + bone_flag.toString(16) + " b:" + b0 + " " + b1 + " " + b2 + " pos:" +
            //           mybuf.pos.toString(16));
            //bone_flag = 0;
            if(bone_flag & 1){
                //connection
                mybuf.readint(bone_index_size);
            }else{
                var f0 = mybuf.readf();
                var f1 = mybuf.readf();
                var f2 = mybuf.readf();
                //console.log(f0 + " " + f1 + " " + f2);
            }
            if(bone_flag & 0x0300){
                // rotatable + movable
                //additional parent
                mybuf.readint(bone_index_size);
                mybuf.readf();
            }
            if(bone_flag & (1 << 10)){
                mybuf.readf();
                mybuf.readf();
                mybuf.readf();
            }
            if(bone_flag & (1 << 11)){
                mybuf.readf();
                mybuf.readf();
                mybuf.readf();
                mybuf.readf();
                mybuf.readf();
                mybuf.readf();
            }
            if(bone_flag & (1 << 13)){
                // external
                mybuf.read32();
            }
            if(bone_flag & (1 << 5)){
                // inverse kine
                mybuf.readint(bone_index_size);
                mybuf.read32();
                mybuf.readf();
                var link_count = mybuf.read32();
                for(var j = 0; j < link_count; j++){
                    mybuf.readint(bone_index_size);
                    var angle_limit = mybuf.read8();
                    if(angle_limit == 1){
                        mybuf.readf();
                        mybuf.readf();
                        mybuf.readf();
                        mybuf.readf();
                        mybuf.readf();
                        mybuf.readf();
                    }
                }
            }
        }//bone loop

        pmx_loaded = true;
        loadcookie();
    }

    function load(callback) {
        var xhr = new XMLHttpRequest();
        basedir = './data/test1/';
        if(window.location.search.search('t') != -1){
            basedir = './data/test2/a/';
        }
        var file = basedir + '/a.pmx';
        if(window.location.search.search('b') != -1){
            file = basedir + '/b.pmx';
        }
        file = window.location.search.replace(/^\?/, "");
        basedir = file.replace(/\/[^\/]*$/, "");
        basedir += "/";
        xhr.open('GET', file, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
            parse(this.response);
            callback();
        };

        xhr.send();

        for(var i = 0; i < default_texture_list.length; i++){
            var img = new Image();

            img.onload = (function(fix_i){
                return function(event){
                    var tex = gltexs_default[fix_i] = gl.createTexture();
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, event.target);
                    //gl.generateMipmap(gl.TEXTURE_2D);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                    gl.bindTexture(gl.TEXTURE_2D, null);

                    resource_loaded();
                }
            })(i);
            img.src = './data/default_toon/' + default_texture_list[i];
        }
    };

    function resource_loaded(){
        if(!pmx_loaded){
            return;
        }
        for(var k = 0; k < gltexs.length; k++){
            if(gltexs[k] == null){
                return;
            }
        }
        for(var k = 0; k < gltexs_default.length; k++){
            if(gltexs_default[k] == null){
                return;
            }
        }
        redraw();
    }

    function create_view_matrix(){
        var vMatrix = m.identity(m.create());
        var tmpx0 = [x0, y0, z0];
        var tmpx1 = [x1, y1, z1];
        for(var i = 0; i < 3; i++){
            tmpx0[i] = (tmpx0[i] - tmpx1[i]) * view_distance + tmpx1[i];
        }
        m.lookAt(tmpx0, tmpx1, [0, 1, 0], vMatrix);
        m.rotate(vMatrix, rad[0], [1, 0, 0], vMatrix);
        m.rotate(vMatrix, rad[1], [0, 1, 0], vMatrix);
        m.rotate(vMatrix, rad[2], [0, 0, 1], vMatrix);
        return vMatrix;
    }

    function create_mv_matrix(mMatrix){
        var vMatrix = create_view_matrix();
        var mvMatrix = m.create();

        m.multiply(vMatrix, mMatrix, mvMatrix);
        return mvMatrix;
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
        gl.enableVertexAttribArray(attLocation['position']);
        gl.vertexAttribPointer(attLocation['position'], attStride['position'], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
        gl.enableVertexAttribArray(attLocation['color']);
        gl.vertexAttribPointer(attLocation['color'], attStride['color'], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, texture_vbo);
        gl.enableVertexAttribArray(attLocation['textureCoord']);
        gl.vertexAttribPointer(attLocation['textureCoord'], attStride['textureCoord'], gl.FLOAT, false, 0, 0);

        // normal
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_normals_vbo);
        gl.enableVertexAttribArray(attLocation['normal']);
        gl.vertexAttribPointer(attLocation['normal'], attStride['normal'], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, edge_scales_vbo);
        gl.enableVertexAttribArray(attLocation['edgeScale']);
        gl.vertexAttribPointer(attLocation['edgeScale'], attStride['edgeScale'], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        gl.uniform1i(uniLocation['texture'], 0);
        gl.uniform1i(uniLocation['useTexture'], true);
        gl.uniform1i(uniLocation['sphereMap'], false);

        var mMatrix = m.identity(m.create());
        gl.uniformMatrix4fv(uniLocation['mvpMatrix'], false, create_mvp_matrix(mMatrix));
        gl.uniformMatrix4fv(uniLocation['mvMatrix'], false, create_mv_matrix(mMatrix));
        gl.uniform3fv(uniLocation['viewVec'], false, create_view_matrix());

        var total_face = 0;
        for(var i = 0; i < material.length; i++){
            if(draws[i] == 0){
                continue;
            }
            mat = material[i];
            gl.uniform1i(uniLocation['useTexture'], true);
            gl.uniform4fv(uniLocation['edgeColor'], [0.0, 0.0, 0.0, 0.0]);
            gl.cullFace(gl.BACK);
            if(material[i].drmode & 1){
                // culling disable
                gl.disable(gl.CULL_FACE);
            }else{
                gl.enable(gl.CULL_FACE);
            }
            var face = mat.face;
            gl.uniform1i(uniLocation['edge'], false);
            if(i == 29){
                //for(var n = 0; n < mat.face; n++){
                //    console.log("u:" + texture_vb[faces_index[material[i].current_face_index+n]*2]+ " v:" +
                //                texture_vb[faces_index[material[i].current_face_index+n]*2+1]);
                //}
            }
            if(mat.texture_index != -1){
                gl.bindTexture(gl.TEXTURE_2D, gltexs[mat.texture_index]);
                if(doDraw[0]){
                    gl.drawElements(gl.TRIANGLES, face, gl.UNSIGNED_SHORT, mat.current_face_index * 2);
                }
            }
            var toon_texture = null;
            if(mat.toon_flag){
                toon_texture = gltexs_default[mat.toon];
            }else{
                toon_texture = gltexs[mat.toon_texture_index];
            }
            if(toon_texture != null){
                gl.bindTexture(gl.TEXTURE_2D, toon_texture);
                if(doDraw[2]){
                    gl.drawElements(gl.TRIANGLES, face, gl.UNSIGNED_SHORT, mat.current_face_index * 2);
                }
            }
            if(mat.drmode & 16){
                gl.enable(gl.CULL_FACE);
                gl.uniform1i(uniLocation['useTexture'], false);
                gl.uniform1i(uniLocation['edge'], true);
                gl.uniform4fv(uniLocation['edgeColor'], mat.edge_color.concat(1.0));
                gl.uniform1f(uniLocation['edgeSize'], mat.edge_size);
                gl.cullFace(gl.FRONT);
                gl.bindTexture(gl.TEXTURE_2D, null);
                if(doDraw[3]){
                    gl.drawElements(gl.TRIANGLES, face, gl.UNSIGNED_SHORT, mat.current_face_index * 2);
                }
            }
            if(material[i].sp_index != -1){
                gl.bindTexture(gl.TEXTURE_2D, gltexs[mat.sp_index]);
                if(doDraw[1]){
                    gl.uniform1i(uniLocation['useTexture'], true);
                    gl.uniform1i(uniLocation['sphereMap'], true);
                    gl.uniform1i(uniLocation['edge'], false);
                    gl.enable(gl.BLEND);
                    if(mat.env_mode == 1){
                        // multiply
                        gl.blendFunc(gl.DST_COLOR, gl.ZERO);
                    }else if(mat.env_mode == 2){
                        // additive
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                    }
                    gl.drawElements(gl.TRIANGLES, face, gl.UNSIGNED_SHORT, mat.current_face_index * 2);
                    gl.disable(gl.BLEND);
                    gl.uniform1i(uniLocation['sphereMap'], false);
                }
            }
        }

        gl.flush();
    }

    function draw(gl, c, prg, vbo, color_vbo, mode) {
        // attributeの要素数を配列に格納
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(attLocation['position']);
        gl.vertexAttribPointer(attLocation['position'], attStride['position'], gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo);
        gl.enableVertexAttribArray(attLocation['color']);
        gl.vertexAttribPointer(attLocation['color'], attStride['color'], gl.FLOAT, false, 0, 0);

        var mMatrix = m.identity(m.create());
        gl.uniformMatrix4fv(uniLocation['mvpMatrix'], false, create_mvp_matrix(mMatrix));
        gl.uniformMatrix4fv(uniLocation['mvMatrix'], false, create_mv_matrix(mMatrix));
        gl.uniform1i(uniLocation['texture'], 0);
        gl.uniform1i(uniLocation['useTexture'], false);
        gl.uniform1i(uniLocation['edge'], false);

        gl.bindTexture(gl.TEXTURE_2D, null);

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
        if(vbo_vertexes){
            draw_face(gl, c, prg, vbo_vertexes, vbo_a_color, vbo_texture, faces_ibo, faces_ibo_count);
        }
        textcon.clearRect(0, 0, textcon.canvas.width, textcon.canvas.height);
        if(vertexes){
            textcon.fillStyle="#FFFFFF";
            textcon.fillRect(10, 20, 400, 30);
            textcon.fillStyle="#333333";
            textcon.fillText(sprintf("(%s,%s,%s) (%s,%s,%s) r=X, g=Y, y=Z Rad=%s,%s param:%s", x0, y0, z0, x1, y1, z1, rad[0].toFixed(3), rad[1].toFixed(3), view_distance), 10, 30);
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

    var attLocation = new Array();
    var attStride = new Array();
    var attVariables = ['position', 'color', 'textureCoord', 'normal', 'edgeScale'];
    var attVariableStrides = [3, 4, 2, 3, 1];
    for(var i in attVariables){
        attLocation[attVariables[i]] = gl.getAttribLocation(prg, attVariables[i]);
        attStride[attVariables[i]] = attVariableStrides[i];
    }

    var uniLocation = new Array();
    var uniformVariables = ['mvpMatrix', 'texture', 'useTexture', 'invMatrix', 'lightDirection', 'edge', 'edgeColor', 'edgeSize', 'edgeScale', 'sphereMap', 'mvMatrix'];
    for(var i in uniformVariables){
        uniLocation[uniformVariables[i]] = gl.getUniformLocation(prg, uniformVariables[i]);
    }
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
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    test_image.src = "./data/white.png";

    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    draw(gl, c, prg, vbo1, vbo_color, 1);
    //setInterval(function(){
    //    redraw();
    //}, 1000);
    var vbo_vertexes;
    var vbo_texture;
    load(function(){
        var a_colors = Array(4 * vertexes.length / 3);
        for(var i = 0; i < a_colors.length; i+=12){
            for(var j = 0; j < 12; j+=1){
                a_colors[i+j] = 1.0;
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
            if(event.target.id == "dodraw0"){
                doDraw[0] = event.target.checked;
                redraw();
                return;
            }else if(event.target.id == "dodraw1"){
                doDraw[1] = event.target.checked;
                redraw();
                return;
            }else if(event.target.id == "dodraw2"){
                doDraw[2] = event.target.checked;
                redraw();
                return;
            }else if(event.target.id == "dodraw3"){
                doDraw[3] = event.target.checked;
                redraw();
                return;
            }
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

        vbo_vertexes = create_vbo(vertexes);
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
    create_button('p1', function(){view_distance *= 1.1;redraw();}, function(){view_distance /= 1.1;redraw();});

    var dragging = false;
    var startx;
    var starty;
    var startrad;
    document.getElementById('canvas').onmousedown = function(e){
        e.preventDefault();
        dragging = true;
        startx = e.offsetX;
        starty = e.offsetY;
        startrad = [].concat(rad);
    };
    document.getElementById('canvas').onmouseup = function(){
        dragging = false;
    };
    document.onmousemove = function(e){
        if(dragging){
            e.preventDefault();
            //rad[0] = startrad[0] + (e.y - starty) / 50;
            rad[1] = startrad[1] + (e.offsetX - startx) / 100;
            redraw();
        }
    };

    document.getElementById('canvas').ontouchstart = function(e){
        dragging = true;
        startx = e.changedTouches[0].pageX;
        starty = e.changedTouches[0].pageY;
        startrad = [].concat(rad);
    };
    document.getElementById('canvas').ontouchend = function(){
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

    document.onwheel = function(e){
        e.preventDefault();
        if(e.deltaY > 0){
            view_distance += 0.2;
        }else{
            if(view_distance < 0.4){
                view_distance = 0.2;
            }else{
                view_distance -= 0.2;
            }
        }
        redraw();
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
    read16be: function() {
        var u = new Uint8Array(this.buf, this.pos, 2);
        this.pos += 2;
        var tmp = u[1] | (u[0] << 8 & 0xFF00);
        return tmp;
    },
    read16: function() {
        var u = new Uint8Array(this.buf, this.pos, 2);
        this.pos += 2;
        var tmp = (u[0]) | (u[1] << 8 & 0xFF00);
        if(tmp >= (1 << 15)){
            return tmp - (1 << 16);
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




