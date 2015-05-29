var define, defineAlias, require;

(function () {
    'use strict';
    var modules = {};
    var state = {
        UNINIT: 0, // 未初始化
        WAITINIT: 1 // 正在等待其他模块初始化
    };

    function defined(mod) {
        return mod.exports || mod._alias || mod._initializer;
    }

    function module(parent, name, isDef) {
        var names = name.split('/');
        var curr;
        names.forEach(function (n, i) {
            curr = parent[n];
            if (curr) {
                if (isDef && i === names.length - 1 && defined(curr)) {
                    throw 'Module ' + name + ' already defined';
                }
            } else {
                if (!isDef) {
                    throw 'Module ' + name + ' not defined';
                }

                curr = {};
                parent[n] = curr;
            }

            parent = curr;
        });

        return curr;
    }

    define = function (name, fn) {
        var mod = module(modules, name, true);

        if (typeof fn !== 'function') {
            mod.exports = fn;
        } else {
            mod._initializer = fn;
            mod._state = state.UNINIT;
        }

    };

    defineAlias = function (name, alias) {
        module(modules, name, true)._alias = alias;
    };

    var requireIn = function(modules, name) {
        var mod = module(modules, name);

        if (mod._alias) {
            return requireIn(mod, mod._alias);
        }

        if (mod.exports) {
            return mod.exports;
        }

        if (mod._state === state.WAITINIT) {
            throw 'Circular dependencies of mod' + name;
        }

        // _state = UNINIT
        mod._state = state.WAITINIT;
        mod.exports = {};
        mod._initializer(mod, mod.exports);
        mod._state = undefined;
        mod._initializer = undefined;

        return mod.exports;
    }

    require = function (name) {
        return requireIn(modules, name)
    };
})();

if (typeof window === 'undefined') {
    module.exports = {
        define: define,
        defineAlias:defineAlias,
        require: require
    };
}
