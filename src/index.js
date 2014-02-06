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
    log: function () {},
    mapper: 'mappers/statsd',
    forwarder: 'forwarders/udp'
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
 * @option log {function}      Log function that expects a single string argument
 *                             (without terminating newline character). Defaults to
 *                             `function () {}`.
 * @option mapper {string}     Data mapper used to transform data before forwarding,
 *                             loaded with `require`. Defaults to 'mappers/statsd'.
 * @option prefix {string}     Prefix to use for mapped metric names. Defaults to ''.
 * @option forwarder {string}  Forwarder used to send data, loaded with `require`.
 *                             Defaults to 'forwarders/udp'.
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
    mapper = require(getMapper(options)).initialise(options);
    forwarder = require(getForwarder(options)).initialise(options);

    log('boomcatch.listen: awaiting POST requests on ' + getHost(options) + ':' + getPort(options));

    http.createServer(handleRequest.bind(null, log, getPath(options), mapper, forwarder))
        .listen(getPort(options), getHost(options));
};

function verifyOptions (options) {
    check.verify.maybe.unemptyString(options.host, 'Invalid host');
    check.verify.maybe.positiveNumber(options.port, 'Invalid port');
    check.verify.maybe.unemptyString(options.path, 'Invalid path');
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

function getMapper (options) {
    return getOption('mapper', options);
}

function getForwarder (options) {
    return getOption('forwarder', options);
}

function handleRequest (log, path, mapper, forwarder, request, response) {
    var queryIndex, requestPath, state;

    if (request.method !== 'GET') {
        return fail(log, response, 405, 'Invalid method `' + request.method + '`');
    }

    queryIndex = request.url.indexOf('?');
    requestPath = queryIndex === -1 ? request.url : request.url.substr(0, queryIndex);

    if (requestPath !== path) {
        return fail(log, response, 404, 'Invalid path `' + requestPath + '`');
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

