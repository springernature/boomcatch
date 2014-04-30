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

modulePath = '../../src/forwarders/file';

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');

suite('forwarders/file:', function () {
    var log;

    setup(function () {
        log = {};
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('fs', {
            writeFile: spooks.fn({
                name: 'writeFile',
                log: log
            })
        });
        mockery.registerMock('path', {
            resolve: spooks.fn({
                name: 'http',
                log: log,
                result: 'mock path.resolve result'
            })
        });
    });

    teardown(function () {
        mockery.deregisterMock('fs');
        mockery.deregisterMock('path');
        mockery.disable();
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
        var file;

        setup(function () {
            file = require(modulePath);
        });

        teardown(function () {
            file = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(file.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                file.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                file.initialise({});
            });
        });

        suite('call initialise:', function () {
            var forwarder;

            setup(function () {
                forwarder = http.initialise({ fwdDir: 'wibble' });
            });

            teardown(function () {
                forwarder = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(forwarder);
            });

            test('fs.writeFile was not called', function () {
                assert.strictEqual(log.counts.writeFile, 0);
            });

            test('path.resolve was not called', function () {
                assert.strictEqual(log.counts.resolve, 0);
            });

            suite('call forwarder:', function () {
                var callback;

                setup(function () {
                    callback = spooks.fn({
                        name: 'callback',
                        log: log
                    });
                    forwarder('foo bar', null, callback);
                });

                teardown(function () {
                    callback = undefined;
                });

                test('fs.writeFile was called once', function () {
                    assert.strictEqual(log.counts.writeFile, 1);
                });

                test('fs.request was called correctly', function () {
                    assert.strictEqual(log.these.writeFile[0], require('fs'));
                    assert.lengthOf(log.args.writeFile[0], 4);
                });
            });
        });
    });
});

