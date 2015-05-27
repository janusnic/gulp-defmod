'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var filepath = require('path');

module.exports = function (dir) {
    dir = dir || "";

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-modefine', 'Streaming not supported'));
            cb();
            return;
        }

        var path = file.path;
        var index = path.indexOf(dir);
        index = (index >= 0 ? index : 0);
        var modname = path.slice(index + dir.length, path.length - 3); // trim dir and suffix '.js'

        file.contents = new Buffer('define(\'' + modname + '\', function(module, exports) {\n' +
            file.contents.toString() +
            '\n};');

        this.push(file);
        cb();
    });
};
