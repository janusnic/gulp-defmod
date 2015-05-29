var gulp = require('gulp');
var buffer = require('gulp-util/lib/buffer');
var defmod = require('..');

gulp.task('default', function () {
    gulp.src(['testdata/*.js', 'testdata/*/*.js','testdata/*/*/*.js']).
        pipe(defmod('testdata')).
        pipe(gulp.dest('dist'));
});
