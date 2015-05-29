'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var filepath = require('path');
var fs = require('fs');

// parsing relative paths
// for 'usr/lib/node_modules',
// return [
//   {relative:'./', path:'usr/lib/node_modules' },
//   {relative:'../', path:'usr/lib/' },
//   {relative:'../../', path:'usr/' },
//   {relative:'../../../', path:'/' },
//   {relative:'../../../../', path:'' }
// ]
function relatives(path, pkgmod) {
    var curr = '\\./';
    var parent = '\\.\\./';

    var rels = [];
    var addrel = function (rel, path) {
        rels.push({
            relative: rel,
            path: path
        });
    };
    var relative = curr;
    var index;
    do {
        index = path.lastIndexOf('/');
        path = (index === -1 ? '' : path.slice(0, index));
        addrel(relative, path === '' ? path : path + '/');
        if (relative === curr) {
            addrel(quote(parent), pkgmod);
            addrel(quote('\\.\\.'), pkgmod);
        }
        relative = (relative === curr ? parent : relative + parent);
    } while (index !== -1);

    return rels;
}

function quote(s) {
    return "'" + s + "'";
}


function pkgmain(dirpath) {
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
    var mod = {
        file: file,
        path: path,
        data: data
    };

    if (data) {
        mod.mod = file.slice(0, file.length - '.js'.length);
    }

    return mod;
}
// {
//  moduler:{bool|string}, whether output moduler loader/defination,
//                         if true, will be the first file, string type
//                         determin the file name to output,
//  dir:{string}, package directory,
//  nopkg:(bool), don't add package name as prefix,
//  onedir:(bool), output file to one directory,
//  sep: if use onedir, the replacement of directory seperator
// }
module.exports = function (opt) {
    opt = opt || {};

    var dirpath = filepath.resolve(opt.dir || '.') + filepath.sep;
    var main = pkgmain(dirpath);
    var pkgname;

    var modutil = {};
    if (opt.nopkg) {
        pkgname = '';
        modutil.name = function (name) {
            return name;
        }
    } else {
        pkgname = filepath.basename(dirpath);
        modutil.name = function (name) {
            return pkgname + (typeof name === 'undefined' ? '' : ('/' + name));
        };
    }
    main.mod = modutil.name(main.mod);
    modutil.filepath = function (path) {
        return opt.onedir ?
            filepath.basename(path).replace(/\//g, opt.sep || '-') :
            path;
    };

    modutil.contents = function (mod, contents, main) {
        var mainalias = main ? 'defineAlias(' + quote(main) + ', ' + quote(mod) + ');' : '';

        return new Buffer('define(\'' + mod + '\', function(module, exports) {\n' +
            contents + '\n});\n' + mainalias);
    };


    modutil.replaceRelatives = function (mod, contents) {
        var rels = relatives(mod, main.mod);
        for (var i = rels.length - 1; i >= 0; i--) {
            var rel = rels[i];
            contents = contents.replace(new RegExp(rel.relative, 'g'), modutil.name(rel.path));
        }
        return contents;
    };

    String.prototype.startsWith = function (start) {
        return this.indexOf(start) === 0;
    };

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
        var callback = function () {
            if (cb) {
                cb();
                cb = null;
            }
        };

        if (opt.moduler) {
            var modulerFile = 'moduler.js';
            this.push(
                new gutil.File({
                    path: typeof opt.moduler === 'string' ? opt.moduler : modulerFile,
                    contents: fs.readFileSync(filepath.join(__dirname, modulerFile))
                })
            );
            callback();
            opt.moduler = null;
        }

        if (main.data) {
            var contents = modutil.replaceRelatives(pkgname, main.data);
            this.push(
                new gutil.File({
                    path: modutil.filepath(main.file),
                    contents: modutil.contents(main.mod, contents, modutil.name())
                })
            );
            callback();
            main.data = null;
        }

        if (file.path === main.path ||
            !file.path.startsWith(dirpath) ||
            filepath.extname(file.path) !== '.js') {

            callback();
            return;
        }

        var mod = file.path.slice(dirpath.length, file.path.length - 3).replace(/\\/g, '/');
        var contents = modutil.replaceRelatives(mod, file.contents.toString());
        file.path = modutil.filepath(file.path);
        file.contents = modutil.contents(modutil.name(mod), contents);

        this.push(file);
        callback();
    }

    return through.obj(wrap);
}
