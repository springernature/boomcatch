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

var assert, modulePath;

assert = require('chai').assert;

modulePath = '../src/normalise';

suite('filters/normalise:', function () {
    var log, results, restrict, cluster, isTooBusy;

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

    test('require returns function', function () {
        assert.isFunction(require(modulePath));
    });

    suite('require:', function () {
        var normalise;

        setup(function () {
            normalise = require(modulePath);
        });

        teardown(function () {
            normalise = undefined;
        });

        test('normalise expects one argument', function () {
            assert.lengthOf(normalise, 1);
        });

        test('normalise throws without data', function () {
            assert.throws(function () {
                normalise();
            });
        });

        test('normalise does not throw with data', function () {
            assert.doesNotThrow(function () {
                normalise({});
            });
        });

        suite('call normalise with bad data:', function () {
            var result;

            setup(function () {
                result = normalise({});
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isObject(result);
                assert.lengthOf(Object.keys(result), 4);
                assert.isUndefined(result.rt);
                assert.isUndefined(result.navtiming);
                assert.isUndefined(result.restiming);
            });
        });

        suite('call normalise with round-trip data:', function () {
            var result;

            setup(function () {
                result = normalise({
                    r: 'foo',
                    'rt.tstart': '1',
                    t_resp: '2',
                    t_page: '3',
                    t_done: '4'
                });
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isObject(result.rt);
                assert.lengthOf(Object.keys(result.rt), 4);
                assert.strictEqual(result.rt.url, 'foo');
                assert.isObject(result.rt.timestamps);
                assert.lengthOf(Object.keys(result.rt.timestamps), 1);
                assert.strictEqual(result.rt.timestamps.start, 1);
                assert.isObject(result.rt.events);
                assert.lengthOf(Object.keys(result.rt.events), 0);
                assert.isObject(result.rt.durations);
                assert.lengthOf(Object.keys(result.rt.durations), 3);
                assert.strictEqual(result.rt.durations.firstbyte, 2);
                assert.strictEqual(result.rt.durations.lastbyte, 5);
                assert.strictEqual(result.rt.durations.load, 4);
                assert.isUndefined(result.navtiming);
                assert.isUndefined(result.restiming);
            });
        });

        suite('call normalise with navigation-timing data:', function () {
            var result;

            setup(function () {
                result = normalise({
                    nt_nav_st: '10',
                    nt_unload_st: '20',
                    nt_unload_end: '30',
                    nt_red_st: '0',
                    nt_red_end: '0',
                    nt_fet_st: '40',
                    nt_dns_st: '50',
                    nt_dns_end: '60',
                    nt_con_st: '70',
                    nt_con_end: '80',
                    nt_ssl_st: '90',
                    nt_req_st: '100',
                    nt_res_st: '110',
                    nt_res_end: '120',
                    nt_domloading: '130',
                    nt_domint: '140',
                    nt_domcontloaded_st: '150',
                    nt_domcontloaded_end: '160',
                    nt_domcomp: '170',
                    nt_load_st: '180',
                    nt_load_end: '190',
                    nt_nav_type: 'foo',
                    nt_red_cnt: '0'
                });
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isObject(result.navtiming);
                assert.lengthOf(Object.keys(result.navtiming), 4);

                assert.strictEqual(result.navtiming.type, 'foo');

                assert.isObject(result.navtiming.timestamps);
                assert.lengthOf(Object.keys(result.navtiming.timestamps), 5);
                assert.strictEqual(result.navtiming.timestamps.start, 10);
                assert.strictEqual(result.navtiming.timestamps.fetchStart, 40);
                assert.strictEqual(result.navtiming.timestamps.sslStart, 90);
                assert.strictEqual(result.navtiming.timestamps.requestStart, 100);
                assert.strictEqual(result.navtiming.timestamps.domInteractive, 140);

                assert.isObject(result.navtiming.events);
                assert.lengthOf(Object.keys(result.navtiming.events), 8);
                assert.isObject(result.navtiming.events.unload);
                assert.lengthOf(Object.keys(result.navtiming.events.unload), 2);
                assert.strictEqual(result.navtiming.events.unload.start, 20);
                assert.strictEqual(result.navtiming.events.unload.end, 30);
                assert.isObject(result.navtiming.events.redirect);
                assert.strictEqual(result.navtiming.events.redirect.start, 0);
                assert.strictEqual(result.navtiming.events.redirect.end, 0);
                assert.isObject(result.navtiming.events.dns);
                assert.strictEqual(result.navtiming.events.dns.start, 50);
                assert.strictEqual(result.navtiming.events.dns.end, 60);
                assert.isObject(result.navtiming.events.connect);
                assert.strictEqual(result.navtiming.events.connect.start, 70);
                assert.strictEqual(result.navtiming.events.connect.end, 80);
                assert.isObject(result.navtiming.events.response);
                assert.strictEqual(result.navtiming.events.response.start, 110);
                assert.strictEqual(result.navtiming.events.response.end, 120);
                assert.isObject(result.navtiming.events.dom);
                assert.strictEqual(result.navtiming.events.dom.start, 130);
                assert.strictEqual(result.navtiming.events.dom.end, 170);
                assert.isObject(result.navtiming.events.domContent);
                assert.strictEqual(result.navtiming.events.domContent.start, 150);
                assert.strictEqual(result.navtiming.events.domContent.end, 160);
                assert.isObject(result.navtiming.events.load);
                assert.strictEqual(result.navtiming.events.load.start, 180);
                assert.strictEqual(result.navtiming.events.load.end, 190);

                assert.isObject(result.navtiming.durations);
                assert.lengthOf(Object.keys(result.navtiming.durations), 0);

                assert.isUndefined(result.rt);
                assert.isUndefined(result.restiming);
            });
        });

        suite('call normalise with resource-timing data:', function () {
            var result;

            setup(function () {
                result = normalise({
                    restiming: {
                        0: {
                            rt_name: 'foo',
                            rt_in_type: 'css',
                            rt_st: '30',
                            rt_dur: '40',
                            rt_red_st: '50',
                            rt_red_end: '60',
                            rt_fet_st: '70',
                            rt_dns_st: '80',
                            rt_dns_end: '90',
                            rt_con_st: '100',
                            rt_con_end: '110',
                            rt_scon_st: '120',
                            rt_req_st: '130',
                            rt_res_st: '140',
                            rt_res_end: '150'
                        },
                        1: {
                            rt_name: 'bar',
                            rt_in_type: 'img',
                            rt_st: '160',
                            rt_dur: '170',
                            rt_red_st: '180',
                            rt_red_end: '190',
                            rt_fet_st: '200',
                            rt_dns_st: '210',
                            rt_dns_end: '220',
                            rt_con_st: '230',
                            rt_con_end: '240',
                            rt_scon_st: '250',
                            rt_req_st: '260',
                            rt_res_st: '270',
                            rt_res_end: '280'
                        }
                    }
                });
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isArray(result.restiming);
                assert.lengthOf(result.restiming, 2);

                assert.isObject(result.restiming[0]);
                assert.lengthOf(Object.keys(result.restiming[0]), 5);
                assert.strictEqual(result.restiming[0].name, 'foo');
                assert.strictEqual(result.restiming[0].type, 'css');
                assert.isObject(result.restiming[0].timestamps);
                assert.lengthOf(Object.keys(result.restiming[0].timestamps), 4);
                assert.strictEqual(result.restiming[0].timestamps.start, 30);
                assert.strictEqual(result.restiming[0].timestamps.fetchStart, 70);
                assert.strictEqual(result.restiming[0].timestamps.sslStart, 120);
                assert.strictEqual(result.restiming[0].timestamps.requestStart, 130);
                assert.isObject(result.restiming[0].events);
                assert.lengthOf(Object.keys(result.restiming[0].events), 4);
                assert.isObject(result.restiming[0].events.redirect);
                assert.lengthOf(Object.keys(result.restiming[0].events.redirect), 2);
                assert.strictEqual(result.restiming[0].events.redirect.start, 50);
                assert.strictEqual(result.restiming[0].events.redirect.end, 60);
                assert.strictEqual(result.restiming[0].events.dns.start, 80);
                assert.strictEqual(result.restiming[0].events.dns.end, 90);
                assert.strictEqual(result.restiming[0].events.connect.start, 100);
                assert.strictEqual(result.restiming[0].events.connect.end, 110);
                assert.strictEqual(result.restiming[0].events.response.start, 140);
                assert.strictEqual(result.restiming[0].events.response.end, 150);
                assert.isObject(result.restiming[0].durations);
                assert.lengthOf(Object.keys(result.restiming[0].durations), 0);

                assert.strictEqual(result.restiming[1].name, 'bar');
                assert.strictEqual(result.restiming[1].type, 'img');
                assert.strictEqual(result.restiming[1].timestamps.start, 160);
                assert.strictEqual(result.restiming[1].timestamps.fetchStart, 200);
                assert.strictEqual(result.restiming[1].timestamps.sslStart, 250);
                assert.strictEqual(result.restiming[1].timestamps.requestStart, 260);
                assert.strictEqual(result.restiming[1].events.redirect.start, 180);
                assert.strictEqual(result.restiming[1].events.redirect.end, 190);
                assert.strictEqual(result.restiming[1].events.dns.start, 210);
                assert.strictEqual(result.restiming[1].events.dns.end, 220);
                assert.strictEqual(result.restiming[1].events.connect.start, 230);
                assert.strictEqual(result.restiming[1].events.connect.end, 240);
                assert.strictEqual(result.restiming[1].events.response.start, 270);
                assert.strictEqual(result.restiming[1].events.response.end, 280);

                assert.isUndefined(result.rt);
                assert.isUndefined(result.navtiming);
            });
        });

        suite('call normalise with reduced resource-timing data:', function () {
            var result;

            setup(function () {
                result = normalise({
                    restiming: {
                        0: {
                            rt_name: 'foo',
                            rt_in_type: 'css',
                            rt_st: '20',
                            rt_dur: '30',
                            rt_fet_st: '40',
                            rt_req_st: '50',
                            rt_res_end: '60'
                        },
                        1: {
                            rt_name: 'bar',
                            rt_in_type: 'img',
                            rt_st: '70',
                            rt_dur: '80',
                            rt_fet_st: '90',
                            rt_req_st: '100',
                            rt_res_end: '110'
                        }
                    }
                });
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isArray(result.restiming);
                assert.lengthOf(result.restiming, 2);

                assert.strictEqual(result.restiming[0].name, 'foo');
                assert.strictEqual(result.restiming[0].type, 'css');
                assert.lengthOf(Object.keys(result.restiming[0].timestamps), 3);
                assert.strictEqual(result.restiming[0].timestamps.start, 20);
                assert.strictEqual(result.restiming[0].timestamps.fetchStart, 40);
                assert.strictEqual(result.restiming[0].timestamps.requestStart, 50);
                assert.lengthOf(Object.keys(result.restiming[0].events), 0);
                assert.lengthOf(Object.keys(result.restiming[0].durations), 0);

                assert.strictEqual(result.restiming[1].name, 'bar');
                assert.strictEqual(result.restiming[1].type, 'img');
                assert.lengthOf(Object.keys(result.restiming[1].timestamps), 3);
                assert.strictEqual(result.restiming[1].timestamps.start, 70);
                assert.strictEqual(result.restiming[1].timestamps.fetchStart, 90);
                assert.strictEqual(result.restiming[1].timestamps.requestStart, 100);
                assert.lengthOf(Object.keys(result.restiming[1].events), 0);
                assert.lengthOf(Object.keys(result.restiming[1].durations), 0);
            });
        });

        suite('call normalise with reduced round-trip data:', function () {
            var result;

            setup(function () {
                result = normalise({
                    'rt.bstart': '1000',
                    'rt.end': '100000'
                });
            });

            teardown(function () {
                result = undefined;
            });

            test('result was correct', function () {
                assert.isUndefined(result.rt);
            });
        });
    });
});

