## Information

<table>
<tr>
<td>Package</td><td>gulp-defmod</td>
</tr>
<tr>
<td>Description</td>
<td>Wrap js files with module defination</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.10</td>
</tr>
</table>

## Usage

```js
var defmod = require('gulp-defmod');

gulp.task('scripts', function() {
  return gulp.src('./lib/*.js')
    .pipe(defmod("lib/"))
    .pipe(gulp.dest('dist'));
});
```

This will wrap contents of each files with module defination like:
```javascript
define('module1', function(module, exports) {
// original file contents here
});
```

### LICENSE 
MIT.
