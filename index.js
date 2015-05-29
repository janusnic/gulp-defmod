'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var filepath = require('path');
var fs = require('fs');

function relatives(path) {
    var prefixes = [];
    var relative = '\\./';
    var index;
    do {
        index = path.lastIndexOf('/');
        path = index === -1 ? '' : path.slice(0, index);
        prefixes.push({
            relative: relative,
            path: path === '' ? path : path + '/'
        });

        relative = (relative === '\\./' ? '\\.\\./' : relative + '\\.\\./');
    } while (index !== -1);

    return prefixes;
}

function quote(s) {
    return '\'' + s + '\'';
}

function defmod(mod, contents, main) {
    main = main ? 'defineAlias(' + quote(main) + ', ' + quote(mod) + ');' : '';

    return new Buffer('define(\'' + mod + '\', function(module, exports) {\n' +
        contents + '\n});\n' + main);
}

function pkgMainfile(dirpath) {
    var file = 'index.js';
    try {
        var pjson = require(filepath.join(dirpath, 'package.json'));
        if (pjson.main) {
            file = pjson.main;
        }
    } catch (e) {}

    var path = filepath.join(dirpath, file);
    var data;
    if (fs.existsSync(path)) {
        data = fs.readFileSync(path, 'utf-8');
    }

    return {
        file: file,
        path: path,
        data: data
    };
}

module.exports = function (dir, onedir, sep) {
    dir = dir || '.';
    var dirpath = filepath.resolve(dir) + filepath.sep;
    var pkgname = filepath.basename(dirpath);

    var main = pkgMainfile(dirpath);

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

        if (main.data) {
            this.push(
                new gutil.File({
                    path: onedir ? main.file.replace(/\//g, sep || '-') : mainfile,
                    contents: defmod(pkgname + '/' + main.file.slice(0, mail.file.length - 3), main.data, pkgname)
                })
            );
            cb();
            main.data = null;
        }

        if (file.path === main.path) {
            return;
        }

        var path = file.path.slice(dirpath.length);
        if (path === '') { // not under this directory
            cb();
            return;
        }

        if (filepath.extname(path) !== '.js') {
            cb();
            return;
        }

        var modname = path.slice(0, path.length - 3).replace(/\\/g, '/'); // trim suffix '.js'

        var contents = file.contents.toString();
        var prefixes = relatives(modname);
        for (var i = prefixes.length - 1; i >= 0; i--) {
            var pref = prefixes[i];
            contents = contents.replace(new RegExp(pref.relative, 'g'), pkgname + '/' + pref.path);
        }

        contents = defmod(pkgname + '/' + modname, contents);
        if (onedir) {
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
