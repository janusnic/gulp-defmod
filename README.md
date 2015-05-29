## Information

<table>
<tr>
<td>Package</td><td>gulp-defmod</td>
</tr>
<tr>
<td>Description</td>
<td>Convert nodejs package for front-end</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.10</td>
</tr>
</table>

## Usage

```js
var defmod = require('gulp-defmod');
var concat = require('gulp-concat');

gulp.task('scripts', function() {
  return gulp.src('package/*.js')
    .pipe(defmod({
        dir:'package',
        moduler:true
    }))
    .pipe(concat('dist.js'))
    .pipe(gulp.dest('.'));
});
```

This will wrap contents of each files with module defination like:
```javascript
define('module1', function(module, exports) {
// original file contents here
});
```
and also, replace all relative path exists in `require'.

### LICENSE 
MIT.
