'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var filepath = require('path');
var gulp = require('gulp');

function relatives(path) {
    var prefixes = [];
    var relative = '\\./';
    console.log(path);
    var index;
    do {
        index = path.lastIndexOf('/');
        path = index === -1 ? '' : path.slice(0, index);
        prefixes.push({
            relative: relative,
            path: path === '' ? path : path + '/'
        });

        relative = (relative === '\\./' ? '\\.\\./' : relative + '\\.\\./');
    } while (index != -1);

    return prefixes;
}

module.exports = function (dir, inone, sep) {
    dir = filepath.resolve(dir || ".") + filepath.sep;

    function wrap(file, enc, cb) {
        if (file.isNull()) {
            cb();
            return;
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-defmod', 'Streaming not supported'));
            cb();
            return;
        }

        var path = file.path.slice(dir.length);
        if (path === '') { // not under this directory
            cb();
            return;
        }

        if (path.lastIndexOf('.js') + 3 !== path.length) {
            cb();
            return;
        }

        var modname = path.slice(0, path.length - 3).replace(/\\/g, '/'); // trim suffix '.js'

        var contents = file.contents.toString();
        var prefixes = relatives(modname);
        for (var i = prefixes.length - 1; i >= 0; i--) {
            var pref = prefixes[i];
            contents = contents.replace(new RegExp(pref.relative, 'g'), pref.path);
        }

        contents = new Buffer('define(\'' + modname + '\', function(module, exports) {\n' +
            contents + '\n};')
        if (inone) {
            file = new gutil.File({
                path: modname.replace(/\//g, sep || '-') + '.js'
            });
        }

        file.contents = contents;
        this.push(file);
        cb();
    }

    return through.obj(wrap);
};
