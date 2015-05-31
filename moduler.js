var define, defineAlias, require;

(function () {
    'use strict'
    var modules = {
        children: {}
    }

    var state = {
        UNINIT: 0, // 未初始化
        WAITINIT: 1 // 正在等待其他模块初始化
    }

    function defined(mod) {
        return mod.exports || mod.alias || mod.initializer
    }

    function module(parent, name, isDef) {
        var names = name.split('/')

        var curr
        names.forEach(function (n, i) {
            curr = parent.children[n]
            if (curr) {
                if (isDef && i === names.length - 1 && defined(curr)) {
                    throw new Error('Module ' + name + ' already defined')
                }
            } else {
                if (!isDef) {
                    throw new Error('Module ' + name + ' not defined')
                }

                curr = {
                    children: {}
                }
                parent.children[n] = curr
            }

            parent = curr
        })

        return curr
    }

    define = function (name, fn) {
        var mod = module(modules, name, true)

        if (typeof fn !== 'function') {
            mod.exports = fn
        } else {
            mod.initializer = fn
            mod.state = state.UNINIT
        }
    }

    defineAlias = function (name, alias) {
        module(modules, name, true).alias = alias
    }

    var requireIn = function (modules, name) {
        var mod = module(modules, name)

        if (mod.alias) {
            return requireIn(mod, mod.alias)
        }

        if (mod.exports) {
            return mod.exports
        }

        if (mod.state === state.WAITINIT) {
            throw new Error('Circular dependencies of mod' + name)
        }

        // state = UNINIT
        mod.state = state.WAITINIT
        mod.exports = {}
        mod.initializer(mod, mod.exports)
        delete(mod, 'state')
        delete(mod, 'initializer')

        return mod.exports
    }

    require = function (name) {
        return requireIn(modules, name)
    }

})()

if (typeof window === 'undefined') {
    module.exports = {
        define: define,
        defineAlias: defineAlias,
        require: require
    }
}
