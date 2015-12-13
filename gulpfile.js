var gulp = require('gulp'); // gulpを読み込む
gulp.task('deploy', function() {
  gulp.src(['!./app/**~', './app/**'])
  .pipe(gulp.dest('./root/'))
  gulp.src(['!./data/**~', './data/**'])
  .pipe(gulp.dest('./root/data/'))
});

gulp.task('watch', function() {
    gulp.watch('./app/**', ['deploy']);
});

gulp.task('default', ['deploy', 'watch']);
