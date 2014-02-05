'use strict';

var assert, spooks, modulePath;

assert = require('chai').assert;
spooks = require('spooks');

modulePath = '../../src/mappers/statsd';

suite('mappers/statsd:', function () {
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
        var statsd;

        setup(function () {
            statsd = require(modulePath);
        });

        teardown(function () {
            statsd = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(statsd.initialise);
        });

        test('initialise throws without options', function () {
            assert.throws(function () {
                udp.initialise();
            });
        });

        test('initialise does not throw with empty options', function () {
            assert.doesNotThrow(function () {
                statsd.initialise({});
            });
        });

        suite('call initialise with default options:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({});
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            test('mapper throws without data', function () {
                assert.throws(function () {
                    mapper();
                });
            });

            test('mapper does not throw with empty data', function () {
                assert.doesNotThrow(function () {
                    mapper({});
                });
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        ntapi: {
                            dns: 0,
                            firstbyte: 1,
                            domload: 2,
                            load: 3
                        },
                        boomerang: {
                            firstbyte: 4,
                            load: 5
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'ntapi.dns:0|ms',
                        'ntapi.firstbyte:1|ms',
                        'ntapi.domload:2|ms',
                        'ntapi.load:3|ms',
                        'boomerang.firstbyte:4|ms',
                        'boomerang.load:5|ms',
                        ''
                    ].join('\n'));
                });
            });

            suite('call mapper with alternative data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        ntapi: {
                            dns: 111,
                            firstbyte: 222,
                            domload: 333,
                            load: 444
                        },
                        boomerang: {
                            firstbyte: 555,
                            load: 666
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'ntapi.dns:111|ms',
                        'ntapi.firstbyte:222|ms',
                        'ntapi.domload:333|ms',
                        'ntapi.load:444|ms',
                        'boomerang.firstbyte:555|ms',
                        'boomerang.load:666|ms',
                        ''
                    ].join('\n'));
                });
            });
        });

        suite('call initialise with prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'foo.'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        ntapi: {
                            dns: 0,
                            firstbyte: 1,
                            domload: 2,
                            load: 3
                        },
                        boomerang: {
                            firstbyte: 4,
                            load: 5
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'foo.ntapi.dns:0|ms',
                        'foo.ntapi.firstbyte:1|ms',
                        'foo.ntapi.domload:2|ms',
                        'foo.ntapi.load:3|ms',
                        'foo.boomerang.firstbyte:4|ms',
                        'foo.boomerang.load:5|ms',
                        ''
                    ].join('\n'));
                });
            });
        });

        suite('call initialise with unterminated prefix:', function () {
            var mapper;

            setup(function () {
                mapper = statsd.initialise({
                    prefix: 'bar'
                });
            });

            teardown(function () {
                mapper = undefined;
            });

            test('initialise returned function', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        ntapi: {
                            dns: 0,
                            firstbyte: 1,
                            domload: 2,
                            load: 3
                        },
                        boomerang: {
                            firstbyte: 4,
                            load: 5
                        }
                    });
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was correct', function () {
                    assert.strictEqual(result, [
                        'bar.ntapi.dns:0|ms',
                        'bar.ntapi.firstbyte:1|ms',
                        'bar.ntapi.domload:2|ms',
                        'bar.ntapi.load:3|ms',
                        'bar.boomerang.firstbyte:4|ms',
                        'bar.boomerang.load:5|ms',
                        ''
                    ].join('\n'));
                });
            });
        });
    });
});

