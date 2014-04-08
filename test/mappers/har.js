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

var mockery, assert, spooks, modulePath;

mockery = require('mockery');
assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/mappers/har';

mockery.registerAllowable(modulePath);
mockery.registerAllowable('../../package.json');
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('querystring');

suite('mappers/har:', function () {
    var log, useragent, browser;

    setup(function () {
        log = {};
        useragent = spooks.fn({
            name: 'useragent',
            log: log
        });
        useragent.lookup = spooks.fn({
            name: 'lookup',
            log: log,
            result: {
                toJSON: function () {
                    log.counts.toJSON += 1;
                    log.these.toJSON.push(this);
                    log.args.toJSON.push(arguments);
                    return browser;
                }
            }
        });
        log.counts.toJSON = 0;
        log.these.toJSON = [];
        log.args.toJSON = [];
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('useragent', useragent);
    });

    teardown(function () {
        mockery.deregisterMock('useragent');
        log = useragent = undefined;
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
        var har;

        setup(function () {
            har = require(modulePath);
        });

        teardown(function () {
            har = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(har.initialise);
        });

        test('initialise does not throw without options', function () {
            assert.doesNotThrow(function () {
                har.initialise();
            });
        });

        test('useragent was not called', function () {
            assert.strictEqual(log.counts.useragent, 0);
        });

        suite('call initialise without options:', function () {
            var mapper;

            setup(function () {
                mapper = har.initialise();
            });

            teardown(function () {
                mapper = undefined;
            });

            test('useragent was called once', function () {
                assert.strictEqual(log.counts.useragent, 1);
            });

            test('useragent was called correctly', function () {
                assert.isUndefined(log.these.useragent[0]);
                assert.lengthOf(log.args.useragent[0], 1);
                assert.isTrue(log.args.useragent[0][0]);
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper throws without data', function () {
                assert.throws(function () {
                    mapper(undefined, 'foo', 'bar');
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({}, 'foo', 'bar');
                });
            });

            suite('call mapper without navtiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        navtiming: {
                        }
                    }, 'foo', 'bar');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });

                // TODO: Test that stuff wasn't called?
            });

            suite('call mapper without restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: {
                        }
                    }, 'foo', 'bar');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });

                // TODO: Test that stuff wasn't called?
            });

            suite('call mapper with valid data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        navtiming: {
                        },
                        restiming: {
                        }
                    }, 'foo', 'bar');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, '');
                });
            });
        });
    });
});

