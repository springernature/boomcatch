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
    qs = require('qs'),
    logger = require('get-off-my-log'),

defaults = {
    host: '0.0.0.0',
    port: 80,
    path: '/beacon',
    referer: /.*/,
    origin: '*',
    limit: 0,
    maxSize: -1,
    log: function () {},
    validator: 'permissive',
    mapper: 'statsd',
    forwarder: 'udp'
};

/**
 * Public function `listen`.
 *
 * Forwards performance metrics calculated from Boomerang beacon requests.
 *
 * @option host {string}         HTTP host name to accept connections on. Defaults to
 *                               '0.0.0.0' (INADDR_ANY).
 * @option port {number}         HTTP port to accept connections on. Defaults to 80.
 * @option path {string}         URL path to accept requests to. Defaults to '/beacon'.
 * @option referer {regexp}      HTTP referers to accept requests from. Defaults to `.*`.
 * @option origin {string|array} URL(s) for the Access-Control-Allow-Origin header.
 * @option limit {number}        Minimum elapsed time between requests from the same IP
 *                               address. Defaults to 0.
 * @option maxSize {number}      Maximum body size for POST requests.
 * @option log {function}        Log function that expects a single string argument
 *                               (without terminating newline character). Defaults to
 *                               `function () {}`.
 * @option validator {string}    Validator used to accept or reject beacon requests.
 *                               Defaults to 'permissive'.
 * @option mapper {string}       Data mapper used to transform data before forwarding,
 *                               loaded with `require`. Defaults to 'statsd'.
 * @option prefix {string}       Prefix to use for mapped metric names. Defaults to ''.
 * @option forwarder {string}    Forwarder used to send data, loaded with `require`.
 *                               Defaults to 'udp'.
 * @option fwdHost {string}      Host name to forward mapped data to (UDP only).
 * @option fwdPort {number}      Port to forward mapped data on (UDP only).
 * @option fwdUrl {string}       URL to forward mapped data to (HTTP only).
 * @option fwdMethod {string}    Method to forward mapped data with (HTTP only).
 */
exports.listen = function (options) {
    var log, path, host, port, mapper, forwarder, validator;

    if (options) {
        verifyOptions(options);
    } else {
        options = {};
    }

    log = getLog(options);
    path = getPath(options);
    host = getHost(options);
    port = getPort(options);
    validator = getValidator(options);
    mapper = getMapper(options);
    forwarder = getForwarder(options);

    log.info('listening for ' + host + ':' + port + path);

    http.createServer(
        handleRequest.bind(
            null,
            log,
            path,
            getReferer(options),
            getOrigin(options),
            getLimit(options),
            getMaxSize(options),
            validator,
            mapper,
            forwarder
        )
    ).listen(port, host);
};

function verifyOptions (options) {
    check.verify.maybe.unemptyString(options.host, 'Invalid host');
    check.verify.maybe.positiveNumber(options.port, 'Invalid port');
    check.verify.maybe.unemptyString(options.path, 'Invalid path');
    check.verify.maybe.instance(options.referer, RegExp, 'Invalid referer');
    check.verify.maybe.positiveNumber(options.limit, 'Invalid limit');
    check.verify.maybe.positiveNumber(options.maxSize, 'Invalid max size');
    check.verify.maybe.fn(options.log, 'Invalid log function');
    check.verify.maybe.unemptyString(options.validator, 'Invalid validator');

    verifyOrigin(options.origin);

    verifyMapperOptions(options);
    verifyForwarderOptions(options);
}

function verifyOrigin (origin) {
    if (check.string(origin)) {
        if (origin !== '*' && origin !== 'null') {
            check.verify.webUrl(origin, 'Invalid access control origin');
        }
    } else if (check.array(origin)) {
        origin.forEach(function (o) {
            check.verify.webUrl(o, 'Invalid access control origin');
        });
    } else if (origin) {
        throw new Error('Invalid access control origin');
    }
}

function verifyMapperOptions (options) {
    check.verify.maybe.unemptyString(options.mapper, 'Invalid data mapper');
    check.verify.maybe.unemptyString(options.prefix, 'Invalid metric prefix');
}

function verifyForwarderOptions (options) {
    check.verify.maybe.unemptyString(options.forwarder, 'Invalid forwarder');

    switch (options.forwarder) {
        case 'http':
            check.verify.webUrl(options.fwdUrl, 'Invalid forwarding URL');
            check.verify.maybe.unemptyString(options.fwdMethod, 'Invalid forwarding method');
            break;
        default:
            check.verify.maybe.unemptyString(options.fwdHost, 'Invalid forwarding host');
            check.verify.maybe.positiveNumber(options.fwdPort, 'Invalid forwarding port');
    }
}

function getLog (options) {
    return logger.initialise('boomcatch', getOption('log', options));
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

function getOrigin (options) {
    return getOption('origin', options);
}

function getLimit (options) {
    var limit = getOption('limit', options);

    if (limit === 0) {
        return null;
    }

    return {
        time: limit,
        requests: {}
    };
}

function getMaxSize (options) {
    return getOption('maxSize', options);
}

function getValidator (options) {
    return getExtension('validator', options);
}

function getExtension (type, options) {
    var name, extension;

    name = getOption(type, options);

    try {
        extension = require('./' + type + 's/' + name);
    } catch (e) {
        extension = require(name);
    }

    return extension.initialise(options);
}

function getMapper (options) {
    return getExtension('mapper', options);
}

function getForwarder (options) {
    return getExtension('forwarder', options);
}

function handleRequest (log, path, referer, origin, limit, maxSize, validator, mapper, forwarder, request, response) {
    var queryIndex, requestPath, state;

    logRequest(log, request);

    response.setHeader('Access-Control-Allow-Origin', getAccessControlOrigin(request.headers, origin));

    if (request.method !== 'GET' && request.method !== 'POST') {
        return fail(log, request, response, 405, 'Invalid method `' + request.method + '`');
    }

    queryIndex = request.url.indexOf('?');
    requestPath = queryIndex === -1 ? request.url : request.url.substr(0, queryIndex);

    if (requestPath !== path) {
        return fail(log, request, response, 404, 'Invalid path `' + requestPath + '`');
    }

    if (check.unemptyString(request.headers.referer) && !referer.test(request.headers.referer)) {
        return fail(log, request, response, 403, 'Invalid referer `' + request.headers.referer + '`');
    }

    if (request.method === 'POST' && !isValidContentType(request.headers['content-type'])) {
        return fail(log, request, response, 415, 'Invalid content type `' + request.headers['content-type'] + '`');
    }

    if (!checkLimit(limit, request)) {
        return fail(log, request, response, 429, 'Exceeded rate `' + limit.time + '`');
    }

    state = {
        body: ''
    };

    request.on('data', receive.bind(null, log, state, maxSize, request, response));
    request.on('end', send.bind(null, log, state, validator, mapper, forwarder, request, response));
}

function logRequest (log, request) {
    log.info(
        'referer=' + (request.headers.referer || '') + ' ' +
        'address=' + request.socket.remoteAddress + '[' + (request.headers['x-forwarded-for'] || '') + ']' + ' ' +
        'method=' + request.method + ' ' +
        'url=' + request.url
    );
}

function getAccessControlOrigin (headers, origin) {
    if (check.array(origin)) {
        if (headers.origin && contains(origin, headers.origin)) {
            return headers.origin;
        }

        return 'null';
    }

    return origin;
}

function contains (array, value) {
    return array.reduce(function (match, candidate) {
        return match || candidate === value;
    }, false);
}

function fail (log, request, response, status, message) {
    log.error(status + ' ' + message);

    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json');
    response.end('{ "error": "' + message + '" }');
    request.socket.destroy();
}

function isValidContentType (contentType) {
    if (!contentType) {
        return false;
    }

    if (contentType === 'application/x-www-form-urlencoded' || contentType === 'text/plain') {
        return true;
    }

    return isValidContentType(contentType.substr(0, contentType.indexOf(';')));
}

function checkLimit (limit, request) {
    var now, address, lastRequest, proxiedAddresses, proxy;

    if (limit === null) {
        return true;
    }

    now = Date.now();
    address = request.socket.remoteAddress;
    lastRequest = limit.requests[address];
    proxiedAddresses = request.headers['x-forwarded-for'];

    if (check.object(lastRequest)) {
        proxy = lastRequest;
        lastRequest = lastRequest[proxiedAddresses || 'self'];
    }

    if (check.positiveNumber(lastRequest) && now <= lastRequest + limit.time) {
        return false;
    }

    if (proxiedAddresses) {
        if (!proxy) {
            proxy = limit.requests[address] = {
                self: lastRequest
            };
        }

        proxy[proxiedAddresses] = now;
    } else {
        limit.requests[address] = now;
    }

    return true;
}

function receive (log, state, maxSize, request, response, data) {
    if (
        (request.method === 'GET' && data.length > 0) ||
        (request.method === 'POST' && maxSize >= 0 && state.body.length + data.length > maxSize)
    ) {
        state.failed = true;
        return fail(log, request, response, 413, 'Body too large');
    }

    state.body += data;
}

function send (log, state, validator, mapper, forwarder, request, response) {
    try {
        var successStatus, data, mappedData;

        if (state.failed) {
            return;
        }

        if (request.method === 'GET') {
            successStatus = 204;
            data = qs.parse(url.parse(request.url).query);
        } else {
            successStatus = 200;

            if (state.body.substr(0, 5) === 'data=') {
                state.body = state.body.substr(5);
            }

            state.body = decodeURIComponent(state.body);

            if (request.headers['content-type'] === 'text/plain') {
                data = JSON.parse(state.body);
            } else {
                data = qs.parse(state.body);
            }
        }

        if (!validator(data)) {
            throw null;
        }

        mappedData = mapper(normaliseData(data), request.headers.referer);
        if (mappedData === '') {
            throw null;
        }

        log.info('sending ' + mappedData);

        forwarder(mappedData, function (error, bytesSent) {
            if (error) {
                return fail(log, request, response, 502, error);
            }

            pass(log, response, successStatus, bytesSent);
        });
    } catch (error) {
        fail(log, request, response, 400, 'Invalid data');
    }
}

function normaliseData (data) {
    return {
        boomerang: normaliseBoomerangData(data),
        navtiming: normaliseNavigationTimingApiData(data),
        restiming: normaliseResourceTimingApiData(data)
    };
}

function normaliseBoomerangData (data) {
    /*jshint camelcase:false */

    var startTime, timeToFirstByte, timeToLoad;

    if (data['rt.tstart']) {
        startTime = parseInt(data['rt.tstart']);
    }

    if (data.t_resp) {
        timeToFirstByte = parseInt(data.t_resp);
    }

    timeToLoad = parseInt(data.t_done);

    if (
        check.maybe.positiveNumber(startTime) &&
        check.maybe.positiveNumber(timeToFirstByte) &&
        check.positiveNumber(timeToLoad)
    ) {
        return {
            start: startTime,
            firstbyte: timeToFirstByte,
            load: timeToLoad
        };
    }
}

function normaliseNavigationTimingApiData (data) {
    /*jshint camelcase:false */

    var startTime, redirectDuration, dnsDuration, connectDuration, timeToFirstByte, timeToDomLoad, timeToLoad;

    startTime = parseInt(data.nt_nav_st);
    redirectDuration = parseInt(data.nt_red_end) - parseInt(data.nt_red_st);
    dnsDuration = parseInt(data.nt_dns_end) - parseInt(data.nt_dns_st);
    connectDuration = parseInt(data.nt_con_end) - parseInt(data.nt_con_st);
    timeToFirstByte = parseInt(data.nt_res_st) - parseInt(data.nt_fet_st);
    timeToDomLoad = parseInt(data.nt_domcontloaded_st) - parseInt(data.nt_fet_st);
    timeToLoad = parseInt(data.nt_load_st) - parseInt(data.nt_fet_st);

    if (
        check.positiveNumber(startTime) &&
        check.number(redirectDuration) &&
        check.number(dnsDuration) &&
        check.number(connectDuration) &&
        check.positiveNumber(timeToFirstByte) &&
        check.positiveNumber(timeToDomLoad) &&
        check.positiveNumber(timeToLoad)
    ) {
        return {
            start: startTime,
            redirect: redirectDuration,
            dns: dnsDuration,
            connect: connectDuration,
            firstbyte: timeToFirstByte,
            domload: timeToDomLoad,
            load: timeToLoad
        };
    }
}

function normaliseResourceTimingApiData (data) {
    /*jshint camelcase:false */

    var startTime, redirectDuration, dnsDuration, connectDuration, timeToFirstByte, timeToLoad;

    if (check.array(data.restiming)) {
        return data.restiming.map(function (resource) {
            // NOTE: We are wilfully reducing precision here from 1/1000th of a millisecond,
            //       for consistency with the Navigation Timing API. Open a pull request if
            //       you think that is the wrong decision! :)
            startTime = parseInt(resource.rt_st);
            redirectDuration = getOptionalResourceTiming(resource, 'rt_red_end', 'rt_red_st');
            dnsDuration = getOptionalResourceTiming(resource, 'rt_dns_end', 'rt_dns_st');
            connectDuration = getOptionalResourceTiming(resource, 'rt_con_end', 'rt_con_st');
            timeToFirstByte = getOptionalResourceTiming(resource, 'rt_res_st', 'rt_st');
            timeToLoad = parseInt(resource.rt_dur);

            // HACK: Google Chrome sometimes reports a zero responseEnd timestamp (which is not
            //       conformant behaviour), leading to a negative duration. A negative duration
            //       is manifestly nonsense, so force it to zero instead. Bug report:
            //           https://code.google.com/p/chromium/issues/detail?id=346960
            if (timeToLoad < 0) {
                timeToLoad = 0;
            }

            if (
                check.positiveNumber(startTime) &&
                check.maybe.number(redirectDuration) &&
                check.maybe.number(dnsDuration) &&
                check.maybe.number(connectDuration) &&
                check.maybe.positiveNumber(timeToFirstByte) &&
                check.number(timeToLoad)
            ) {
                return {
                    name: resource.rt_name,
                    type: resource.rt_in_type,
                    start: startTime,
                    redirect: redirectDuration,
                    dns: dnsDuration,
                    connect: connectDuration,
                    firstbyte: timeToFirstByte,
                    load: timeToLoad
                };
            }
        });
    }
}

function getOptionalResourceTiming (data, endKey, startKey) {
    if (data[endKey] && data[startKey]) {
        return parseInt(data[endKey]) - parseInt(data[startKey]);
    }
}

function pass (log, response, status, bytes) {
    log.info('sent ' + bytes + ' bytes');

    response.statusCode = status;
    response.end();
}

