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

/*globals require, exports */

'use strict';

var check = require('check-types'),
    http = require('http'),
    url = require('url'),
    qs = require('querystring'),

defaults = {
    host: '0.0.0.0',
    port: 80,
    path: '/beacon',
    referer: /.*/,
    log: function () {},
    mapper: 'statsd',
    forwarder: 'udp'
};

/**
 * Public function `listen`.
 *
 * Forwards performance metrics calculated from Boomerang/Kylie beacon events.
 *
 * @option host {string}       HTTP host name to accept connections on. Defaults to
 *                             '0.0.0.0' (INADDR_ANY).
 * @option port {number}       HTTP port to accept connections on. Defaults to 80.
 * @option path {string}       URL path to accept requests to. Defaults to '/beacon'.
 * @option referer {regexp}    HTTP referers to accept requests from. Defaults to `.*`.
 * @option log {function}      Log function that expects a single string argument
 *                             (without terminating newline character). Defaults to
 *                             `function () {}`.
 * @option mapper {string}     Data mapper used to transform data before forwarding,
 *                             loaded with `require`. Defaults to 'statsd'.
 * @option prefix {string}     Prefix to use for mapped metric names. Defaults to ''.
 * @option forwarder {string}  Forwarder used to send data, loaded with `require`.
 *                             Defaults to 'udp'.
 * @option fwdHost {string}    Host name to forward mapped data to.
 * @option fwdPort {number}    Port to forward mapped data on.
 */
exports.listen = function (options) {
    var log, mapper, forwarder;

    if (options) {
        verifyOptions(options);
    } else {
        options = {};
    }

    log = getLog(options);
    mapper = getMapper(options);
    forwarder = getForwarder(options);

    log('boomcatch.listen: awaiting POST requests on ' + getHost(options) + ':' + getPort(options));

    http.createServer(handleRequest.bind(null, log, getPath(options), getReferer(options), mapper, forwarder))
        .listen(getPort(options), getHost(options));
};

function verifyOptions (options) {
    check.verify.maybe.unemptyString(options.host, 'Invalid host');
    check.verify.maybe.positiveNumber(options.port, 'Invalid port');
    check.verify.maybe.unemptyString(options.path, 'Invalid path');
    check.verify.maybe.instance(options.referer, RegExp, 'Invalid referer');
    check.verify.maybe.fn(options.log, 'Invalid log function');
    check.verify.maybe.unemptyString(options.mapper, 'Invalid data mapper');
    check.verify.maybe.unemptyString(options.prefix, 'Invalid metric prefix');
    check.verify.maybe.unemptyString(options.forwarder, 'Invalid forwarder');
    check.verify.maybe.unemptyString(options.fwdHost, 'Invalid forwarding host');
    check.verify.maybe.positiveNumber(options.fwdPort, 'Invalid forwarding port');
}

function getLog (options) {
    return getOption('log', options);
}

function getOption (name, options) {
    return options[name] || defaults[name];
}

function getHost (options) {
    return getOption('host', options);
}

function getPort (options) {
    return getOption('port', options);
}

function getPath (options) {
    return getOption('path', options);
}

function getReferer (options) {
    return getOption('referer', options);
}

function getMapper (options) {
    return getExtension('mapper', options);
}

function getExtension (name, options) {
    var path = getOption(name, options), extension;

    try {
        extension = require('./' + name + 's/' + path);
    } catch (e) {
        extension = require(path);
    }

    return extension.initialise(options);
}

function getForwarder (options) {
    return getExtension('forwarder', options);
}

function handleRequest (log, path, referer, mapper, forwarder, request, response) {
    var queryIndex, requestPath, state;

    if (request.method !== 'GET') {
        return fail(log, response, 405, 'Invalid method `' + request.method + '`');
    }

    queryIndex = request.url.indexOf('?');
    requestPath = queryIndex === -1 ? request.url : request.url.substr(0, queryIndex);

    if (requestPath !== path) {
        return fail(log, response, 404, 'Invalid path `' + requestPath + '`');
    }

    if (check.unemptyString(request.headers.referer) && !referer.test(request.headers.referer)) {
        return fail(log, response, 403, 'Invalid referer `' + request.headers.referer + '`');
    }

    state = {};

    request.on('data', receive.bind(null, log, state, request, response));
    request.on('end', send.bind(null, log, state, mapper, forwarder, request, response));
}

function fail (log, response, status, message) {
    log('boomcatch.fail: ' + status + ' ' + message);

    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.end('{ "error": "' + message + '" }');
}

function receive (log, state, request, response, data) {
    if (data.length > 0) {
        state.failed = true;
        fail(log, response, 413, 'Body too large');
    }
}

function send (log, state, mapper, forwarder, request, response) {
    try {
        var data;

        if (state.failed) {
            return;
        }

        data = mapper(normaliseData(qs.parse(url.parse(request.url).query)));

        log('boomcatch.send: ' + data);

        forwarder(data, function (error, bytesSent) {
            if (error) {
                return fail(log, response, 502, error);
            }

            pass(log, response, bytesSent);
        });
    } catch (error) {
        request.socket.destroy();
        fail(log, response, 400, 'Invalid data');
    }
}

function normaliseData (data) {
    return {
        boomerang: normaliseBoomerangData(data),
        ntapi: normaliseNavigationTimingApiData(data)
    };
}

function normaliseBoomerangData (data) {
    /*jshint camelcase:false */

    var timeToFirstByte = parseInt(data.t_resp), timeToLoad = parseInt(data.t_done);

    check.verify.positiveNumber(timeToFirstByte);
    check.verify.positiveNumber(timeToLoad);

    return {
        firstbyte: timeToFirstByte,
        load: timeToLoad
    };
}

function normaliseNavigationTimingApiData (data) {
    /*jshint camelcase:false */

    var timeToDns, timeToFirstByte, timeToDomLoad, timeToLoad;

    timeToDns = parseInt(data.nt_dns_end) - parseInt(data.nt_fet_st);
    timeToFirstByte = parseInt(data.nt_res_st) - parseInt(data.nt_fet_st);
    timeToDomLoad = parseInt(data.nt_domcontloaded_st) - parseInt(data.nt_fet_st);
    timeToLoad = parseInt(data.nt_load_st) - parseInt(data.nt_fet_st);

    if (
        check.number(timeToDns) &&
        check.positiveNumber(timeToFirstByte) &&
        check.positiveNumber(timeToDomLoad) &&
        check.positiveNumber(timeToLoad)
    ) {
        return {
            dns: timeToDns,
            firstbyte: timeToFirstByte,
            domload: timeToDomLoad,
            load: timeToLoad
        };
    }
}

function pass (log, response, bytes) {
    log('boomcatch.pass: Sent ' + bytes + ' bytes');

    response.statusCode = 204;
    response.end();
}

