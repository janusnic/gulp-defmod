'use strict';
var mod = require('../moduler');
var assert = require('assert');

describe('moduler', function () {
    mod.define('user/a/b/c', function (module, exports) {
        exports.name = 'aaa';
        exports.age = 20;
        exports.id = 0;
        exports.address = mod.require('address/a/b');
    });

    mod.defineAlias('user/a/b', 'c')

    mod.define('address/a/b/c', function (module, exports) {
        exports.street = 'aaa';
    });

    mod.defineAlias('address/a/b', 'c')

    var user = mod.require('user/a/b');

    it('should ok', function () {
        assert.equal(user.name, 'aaa');
        assert.equal(user.address.street, 'aaa');
    });
});
