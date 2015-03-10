// Copyright © 2014 Nature Publishing Group
//
// This file is part of boomcatch.
//
// Boomcatch is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Boomcatch is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with boomcatch. If not, see <http://www.gnu.org/licenses/>.

'use strict';

var assert, modulePath;

assert = require('chai').assert;

modulePath = '../../src/filters/unfiltered';

suite('filters/unfiltered:', function () {
    var log;

    setup(function () {
        log = {};
    });

    teardown(function () {
        log = undefined;
    });

    test('require does not throw', function () {
        assert.doesNotThrow(function () {
            require(modulePath);
        });
    });

    test('require returns object', function () {
        assert.isObject(require(modulePath));
    });

    suite('require:', function () {
        var unfiltered;

        setup(function () {
            unfiltered = require(modulePath);
        });

        teardown(function () {
            unfiltered = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(unfiltered.initialise);
        });

        test('initialise does not throw', function () {
            assert.doesNotThrow(function () {
                unfiltered.initialise();
            });
        });

        suite('call initialise:', function () {
            var filter;

            setup(function () {
                filter = unfiltered.initialise();
            });

            teardown(function () {
                filter = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(filter);
            });

            test('filter does not throw', function () {
                assert.doesNotThrow(function () {
                    filter();
                });
            });

            suite('call filter:', function () {
                var result;

                setup(function () {
                    result = filter('wibble');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, 'wibble');
                });
            });

            suite('call filter with alternative data:', function () {
                var result, data;

                setup(function () {
                    data = {
                        foo: 'bar',
                        baz: 'qux'
                    };
                    result = filter(data);
                });

                teardown(function () {
                    data = result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, data);
                });

                test('data is unmodified', function () {
                    assert.lengthOf(Object.keys(result), 2);
                    assert.strictEqual(result.foo, 'bar');
                    assert.strictEqual(result.baz, 'qux');
                });
            });
        });
    });
});

