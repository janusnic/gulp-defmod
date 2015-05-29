var define, require;

(function () {
    'use strict';
    var _modules = {};
    var _moduleState = {
        UNINIT: 0, // 未初始化
        WAITINIT: 1 // 正在等待其他模块初始化
    };

    define = function (name, fn) {
        if (_modules[name]) {
            throw 'Module ' + name + ' already defined';
        }

        if (typeof fn !== 'function') {
            _modules[name] = {
                exports: fn,
            };
        } else {
            _modules[name] = {
                _initializer: fn,
                _state: _moduleState.UNINIT,
                _path:''
            };
        }
    };

    defineAlias = function(name, alias) {
        if (_modules[name]) {
            throw 'Module ' + name + ' already defined';
        }

        _modules[name] = {
            _alias:alias
        }
    }

    require = function (name) {
        var module = _modules[name];
        if (!module) {
            throw 'Module ' + name + ' not defined';
        }

        if (module._alias) {
            return require(module._alias);
        }

        if (module.exports) {
            return module.exports;
        }

        if (module._state === _moduleState.WAITINIT) {
            throw 'Circular dependencies of module' + name;
        }

        // _state = UNINIT
        module._state = _moduleState.WAITINIT;
        module.exports = {};
        module._initializer(module, module.exports);
        module._state = undefined;
        module._initializer = undefined;

        return module.exports;
    };
})();
