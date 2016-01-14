// Copyright © 2014, 2015 Nature Publishing Group
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

var assert, cheerio, packageInfo, modulePath;

assert = require('chai').assert;
cheerio = require('cheerio');
packageInfo = require('../../package.json');
modulePath = '../../src/mappers/waterfall';

suite('mappers/waterfall:', function () {
    test('require does not throw', function () {
        assert.doesNotThrow(function () {
            require(modulePath);
        });
    });

    test('require returns object', function () {
        assert.isObject(require(modulePath));
    });

    suite('require:', function () {
        var waterfall;

        setup(function () {
            waterfall = require(modulePath);
        });

        teardown(function () {
            waterfall = undefined;
        });

        test('initialise function is exported', function () {
            assert.isFunction(waterfall.initialise);
        });

        test('initialise does not throw with empty arguments', function () {
            assert.doesNotThrow(function () {
                waterfall.initialise({});
            });
        });

        suite('call initialise with default arguments:', function () {
            var mapper;

            setup(function () {
                mapper = waterfall.initialise({});
            });

            teardown(function () {
                mapper = undefined;
            });

            test('function was returned', function () {
                assert.isFunction(mapper);
            });

            suite('call mapper without restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        'rt.tstart': '1',
                        t_resp: '2',
                        t_page: '3',
                        t_done: '4',
                        nt_nav_type: 'wibble',
                        nt_nav_st: '5',
                        nt_fet_st: '6',
                        nt_ssl_st: '7',
                        nt_req_st: '8',
                        nt_domint: '9',
                        nt_unload_st: '10',
                        nt_unload_end: '11',
                        nt_red_st: '12',
                        nt_red_end: '13',
                        nt_dns_st: '14',
                        nt_dns_end: '15',
                        nt_con_st: '16',
                        nt_con_end: '17',
                        nt_res_st: '18',
                        nt_res_end: '19',
                        nt_domloading: '20',
                        nt_domcomp: '21',
                        nt_domcontloaded_st: '22',
                        nt_domcontloaded_end: '23',
                        nt_load_st: '24',
                        nt_load_end: '25'
                    }, 'foo');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was empty string', function () {
                    assert.strictEqual(result, '');
                });
            });

            suite('call mapper with restiming data:', function () {
                var result;

                setup(function () {
                    result = mapper({
                        restiming: {
                            0: {
                                rt_st: '1',
                                rt_fet_st: '2',
                                rt_scon_st: '3',
                                rt_req_st: '4',
                                rt_red_st: '5',
                                rt_red_end: '6',
                                rt_dns_st: '7',
                                rt_dns_end: '8',
                                rt_con_st: '9',
                                rt_con_end: '10',
                                rt_res_st: '11',
                                rt_res_end: '12',
                                rt_name: 'foo',
                                rt_in_type: 'css'
                            },
                            1: {
                                rt_st: '9',
                                rt_fet_st: '10',
                                rt_scon_st: '11',
                                rt_req_st: '12',
                                rt_red_st: '130',
                                rt_red_end: '180',
                                rt_dns_st: '140',
                                rt_dns_end: '200',
                                rt_con_st: '150',
                                rt_con_end: '220',
                                rt_res_st: '160',
                                rt_res_end: '240',
                                rt_name: 'bar',
                                rt_in_type: 'img'
                            }
                        }
                    }, 'baz');
                });

                teardown(function () {
                    result = undefined;
                });

                test('result was not empty string', function () {
                    assert.notEqual(result, '');
                });

                suite('parse result:', function () {
                    var $;

                    setup(function () {
                        $ = cheerio.load(result);
                    });

                    teardown(function () {
                        $ = undefined;
                    });

                    test('generator is correct', function () {
                        assert.strictEqual(
                            $('meta[name="generator"]').attr('content'),
                            'boomcatch ' + packageInfo.version
                        );
                    });

                    test('title is correct', function () {
                        assert.strictEqual(
                            $('title').text(),
                            'baz'
                        );
                    });

                    test('h1 is correct', function () {
                        var h1 = $('h1');

                        assert.lengthOf(h1, 1);
                        assert.strictEqual(h1.text(), 'baz');
                    });

                    test('svg seems correct', function () {
                        assert.lengthOf($('svg'), 1);
                        assert.lengthOf($('g'), 5);
                        assert.lengthOf($('svg > g'), 2);
                        assert.lengthOf($('rect'), 14);
                        assert.lengthOf($('text'), 8);
                        assert.lengthOf($('line'), 5);
                        assert.notEqual(result.indexOf('<svg width="960px" height="98px" aria-describedby="colour-key">'), -1);
                        assert.notEqual(result.indexOf('<g transform="translate(0, 0)" data-resource="0">'), -1);
                        assert.notEqual(result.indexOf('<g transform="translate(0, 24)" data-resource="1">'), -1);
                    });

                    test('colour key seems correct', function () {
                        assert.lengthOf($('table.key'), 1);
                        assert.lengthOf($('table.key th'), 2);
                        assert.lengthOf($('table.key > tbody > tr'), 6);
                    });

                    test('raw data seems correct', function () {
                        assert.lengthOf($('[data-raw] table'), 1);
                        assert.lengthOf($('[data-raw] th'), 14);
                        assert.lengthOf($('[data-raw] table > tbody > tr'), 2);
                    });

                    test('mouseover details seem correct', function () {
                        assert.lengthOf($('.resource-detail'), 2);
                        assert.lengthOf($('.resource-detail .resource-type'), 2);
                        assert.lengthOf($('.resource-detail .resource-start'), 12);
                        assert.lengthOf($('.resource-detail .resource-duration'), 12);
                        assert.lengthOf($('.resource-detail .resource-timing'), 20);
                    });
                });
            });
        });
    });
});

