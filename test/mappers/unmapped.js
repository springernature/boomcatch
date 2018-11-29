// Copyright © 2014, 2015, 2016 Springer Nature
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

var assert, mockery, spooks, modulePath;

assert = require('chai').assert;
mockery = require('mockery');
spooks = require('spooks');

modulePath = '../../src/mappers/unmapped';

mockery.registerAllowable(modulePath);

suite('mappers/unmapped:', function () {
    var log, browser, useragent;

    setup(function () {
        log = {};
        browser = { family: {}, major: {} };
        useragent = spooks.fn({ name: 'useragent', log: log });
        useragent.lookup = spooks.fn({
            name: 'lookup',
            log: log,
            results: [
                {
                    toJSON: function () {
                        log.counts.toJSON += 1;
                        log.these.toJSON.push(this);
                        log.args.toJSON.push(arguments);
                        return browser;
                    }
                }
            ]
        });
        log.counts.toJSON = 0;
        log.these.toJSON = [];
        log.args.toJSON = [];
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('useragent', useragent);
    });

    teardown(function () {
        mockery.deregisterMock('useragent');
        mockery.disable();
        log = browser = useragent = undefined;
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
        var unmapped;

        setup(function () {
            unmapped = require(modulePath);
        });

        teardown(function () {
            unmapped = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(unmapped.initialise);
        });


        test('initialise does not throw', function () {
            assert.doesNotThrow(function () {
                unmapped.initialise();
            });
        });

        test('useragent was not called', function () {
            assert.strictEqual(log.counts.useragent, 0);
        });

        suite('initialise:', function () {
            var mapper;

            setup(function () {
                mapper = unmapped.initialise();
            });

            teardown(function () {
                mapper = undefined;
            });

            test('useragent was called once', function () {
                assert.strictEqual(log.counts.useragent, 1);
            });

            test('useragent was called correctly', function () {
                assert.lengthOf(log.args.useragent[0], 1);
                assert.isTrue(log.args.useragent[0][0]);
            });

            test('useragent.lookup was not called', function () {
                assert.strictEqual(log.counts.lookup, 0);
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper does not throw', function () {
                assert.doesNotThrow(function () {
                    mapper();
                });
            });

            suite('call mapper:', function () {
                var data, referer, userAgent, remoteAddress, result;

                setup(function () {
                    data = {};
                    referer = {};
                    userAgent = {};
                    remoteAddress = {};
                    result = mapper(data, referer, userAgent, remoteAddress);
                });

                teardown(function () {
                    data = referer = userAgent = remoteAddress = result = undefined;
                });

                test('useragent.lookup was called once', function () {
                    assert.strictEqual(log.counts.lookup, 1);
                });

                test('useragent was called correctly', function () {
                    assert.lengthOf(log.args.lookup[0], 1);
                    assert.strictEqual(log.args.lookup[0][0], userAgent);
                    assert.lengthOf(Object.keys(log.args.lookup[0][0]), 0);
                });

                test('useragent was not called', function () {
                    assert.strictEqual(log.counts.useragent, 1);
                });

                test('result was correct', function () {
                    assert.strictEqual(result,
                        '{"data":{},"referer":{},"userAgent":{},"browser":{"name":{},"version":{}},"remoteAddress":{}}');
                });
            });
        });
    });
});
