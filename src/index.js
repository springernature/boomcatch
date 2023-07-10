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

/*globals require, exports, process, setTimeout */

'use strict';

var check = require('check-types'),
    http = require('http'),
    https = require('https'),
    url = require('url'),
    qs = require('qs'),
    fs = require('fs'),
    toobusy = require('toobusy-js'),
    cluster = require('cluster'),

defaults = {
    host: '0.0.0.0',
    port: 80,
    https: false,
    path: '/beacon',
    referer: /.*/,
    origin: '*',
    limit: 0,
    maxSize: -1,
    log: {
        info: function () {},
        warn: function () {},
        error: function () {}
    },
    validator: 'permissive',
    filter: 'unfiltered',
    mapper: 'statsd',
    forwarder: 'udp',
    workers: 0,
    delayRespawn: 0,
    maxRespawn: -1
},

urlRegex = /^https?:\/\/.+/,

tlsCiphers = [
    'ECDHE-RSA-AES256-SHA384',
    'DHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES256-SHA256',
    'DHE-RSA-AES256-SHA256',
    'ECDHE-RSA-AES128-SHA256',
    'DHE-RSA-AES128-SHA256',
    'HIGH',
    '!aNULL',
    '!eNULL',
    '!EXPORT',
    '!DES',
    '!RC4',
    '!MD5',
    '!PSK',
    '!SRP',
    '!CAMELLIA'
].join(':'),

signals;

/**
 * Public function `listen`.
 *
 * Forwards performance metrics calculated from Boomerang beacon requests.
 *
 * @option host {string}         Host name to accept connections on. Defaults to
 *                               '0.0.0.0' (INADDR_ANY).
 * @option port {number}         Port to accept connections on. Defaults to 80 for
 *                               HTTP or 443 for HTTPS.
 * @option https {boolean}       Start the server in HTTPS mode. Defaults to false.
 * @option httpsPfx {string}     PFX/PKCX12 string containing private key, cert and
 *                               CA certs (HTTPS only).
 * @option httpsKey {string}     Path to private key file, ignored if `httpsPfx` is
 *                               set (HTTPS only).
 * @option httpsCert {string}    Path to certificate file, ignored if `httpsPfx` is
 *                               set (HTTPS only).
 * @option httpsPass {string}    Passphrase for `httpsPfx` or `httpsKey` options
 *                               (HTTPS only).
 * @option path {string}         URL path to accept requests to. Defaults to '/beacon'.
 * @option referer {regexp}      Referers to accept requests from. Defaults to `.*`.
 * @option origin {string|array} URL(s) for the Access-Control-Allow-Origin header.
 * @option limit {number}        Minimum elapsed time between requests from the same
 *                               IP address. Defaults to 0.
 * @option maxSize {number}      Maximum body size for POST requests.
 * @option log {object}          Object with `info` and `error` log functions.
 * @option validator {string}    Validator used to accept or reject beacon requests,
 *                               loaded with `require`. Defaults to 'permissive'.
 * @option filter {string}       Filter used to purge unwanted data, loaded with `require`.
 *                               Defaults to `unfiltered`.
 * @option mapper {string}       Data mapper used to transform data before forwarding,
 *                               loaded with `require`. Defaults to 'statsd'.
 * @option prefix {string}       Prefix to use for mapped metric names. Defaults to ''.
 * @option svgTemplate {string}  Path to alternative SVG handlebars template file (SVG
 *                               mapper only).
 * @option svgSettings {string}  Path to alternative SVG settings JSON file (SVG mapper
 *                               only).
 * @option forwarder {string}    Forwarder used to send data, loaded with `require`.
 *                               Defaults to 'udp'.
 * @option fwdHost {string}      Host name to forward mapped data to (UDP forwarder only).
 * @option fwdPort {number}      Port to forward mapped data on (UDP forwarder only).
 * @option fwdSize {bytes}       Maximum allowable packet size for data forwarding (UDP
 *                               forwarder only).
 * @option fwdUrl {string}       URL to forward mapped data to (HTTP forwarder only).
 * @option fwdMethod {string}    Method to forward mapped data with (HTTP forwarder only).
 * @option fwdDir {string}       Directory to write mapped data to (file forwarder only).
 * @option workers {number}      Number of child worker processes to fork. Defaults to 0.
 * @option delayRespawn {number} Number of milliseconds to delay respawning. Defaults to 0.
 * @option maxRespawn {number}   Maximum number of respawn attempts. Defaults to -1.
 */
exports.listen = function (options) {
    var workers, log;

    if (options) {
        verifyOptions(options);
    } else {
        options = {};
    }

    workers = getWorkers(options);
    log = getLog(options);

    createExceptionHandler(log);

    if (cluster.isMaster) {
        log.info('starting boomcatch in process ' + process.pid + ' with options:\n' + JSON.stringify(options, null, '    '));

        createSignalHandlers(log);

        if (workers > 0) {
            return createWorkers(workers, options, log);
        }
    }

    createServer(options, log);
};

function verifyOptions (options) {
    check.assert.maybe.unemptyString(options.host, 'Invalid host');
    check.assert.maybe.positive(options.port, 'Invalid port');
    check.assert.maybe.unemptyString(options.path, 'Invalid path');
    check.assert.maybe.instance(options.referer, RegExp, 'Invalid referer');
    check.assert.maybe.positive(options.limit, 'Invalid limit');
    check.assert.maybe.positive(options.maxSize, 'Invalid max size');
    check.assert.maybe.unemptyString(options.validator, 'Invalid validator');
    check.assert.maybe.unemptyString(options.filter, 'Invalid filter');
    check.assert.maybe.number(options.workers, 'Invalid workers');
    check.assert.not.negative(options.workers, 'Invalid workers');
    check.assert.maybe.number(options.delayRespawn, 'Invalid worker respawn delay');
    check.assert.not.negative(options.delayRespawn, 'Invalid worker respawn delay');
    check.assert.maybe.number(options.maxRespawn, 'Invalid worker respawn limit');

    verifyOrigin(options.origin);
    verifyLog(options.log);

    verifyHttpsOptions(options);
    verifyMapperOptions(options);
    verifyForwarderOptions(options);
}

function verifyOrigin (origin) {
    if (check.string(origin)) {
        if (origin !== '*' && origin !== 'null') {
            check.assert.match(origin, urlRegex);
        }
    } else if (check.array(origin)) {
        origin.forEach(function (o) {
            check.assert.match(o, urlRegex);
        });
    } else if (origin) {
        throw new Error('Invalid access control origin');
    }
}

function verifyLog (log) {
    check.assert.maybe.object(log, 'Invalid log object');

    if (check.object(log)) {
        check.assert.function(log.info, 'Invalid log.info function');
        check.assert.function(log.warn, 'Invalid log.warn function');
        check.assert.function(log.error, 'Invalid log.error function');
    }
}

function verifyHttpsOptions (options) {
    if (options.https) {
        if (options.httpsPfx) {
            check.assert.unemptyString(options.httpsPfx);
        } else {
            verifyFile(false, options.httpsKey, 'Invalid private key path');
            verifyFile(false, options.httpsCert, 'Invalid certificate path');
        }

        check.assert.maybe.unemptyString(options.httpsPass);
    }
}

function verifyFile (isOptional, path, message) {
    verifyFs(isOptional, path, 'isFile', message);
}

function verifyFs (isOptional, path, method, message) {
    var stat;

    if (isOptional && !path) {
        return;
    }

    check.assert.unemptyString(path, message);

    if (fs.existsSync(path)) {
        stat = fs.statSync(path);

        if (stat[method]()) {
            return;
        }
    }

    throw new Error(message);
}

function verifyMapperOptions (options) {
    check.assert.maybe.unemptyString(options.mapper, 'Invalid data mapper');
    check.assert.maybe.unemptyString(options.prefix, 'Invalid metric prefix');
}

function verifyForwarderOptions (options) {
    check.assert.maybe.unemptyString(options.forwarder, 'Invalid forwarder');

    switch (options.forwarder) {
        case 'waterfall-svg':
            verifyFile(true, options.svgTemplate, 'Invalid SVG template path');
            verifyFile(true, options.svgSettings, 'Invalid SVG settings path');
            break;
        case 'file':
            verifyDirectory(options.fwdDir, 'Invalid forwarding directory');
            break;
        case 'http':
            check.assert.match(options.fwdUrl, urlRegex);
            check.assert.maybe.unemptyString(options.fwdMethod, 'Invalid forwarding method');
            break;
        default:
            check.assert.maybe.unemptyString(options.fwdHost, 'Invalid forwarding host');
            check.assert.maybe.positive(options.fwdPort, 'Invalid forwarding port');
            check.assert.maybe.positive(options.fwdSize, 'Invalid forwarding packet size');
    }
}

function verifyDirectory (path, message) {
    verifyFs(false, path, 'isDirectory', message);
}

function getWorkers (options) {
    return getOption('workers', options);
}

function getOption (name, options) {
    return options[name] || defaults[name];
}

function getLog (options) {
    return getOption('log', options);
}

function createExceptionHandler (log) {
    process.on('uncaughtException', handleException.bind(null, log));
}

function handleException (log, error) {
    log.error('unhandled exception\n' + error.stack);
    process.exit(1);
}

function createSignalHandlers (log) {
    signals.forEach(function (signal) {
        process.on(signal.name, handleTerminalSignal.bind(null, log, signal.name, signal.value));
    });
}

signals = [
    { name: 'SIGHUP', value: 1 },
    { name: 'SIGINT', value: 2 },
    { name: 'SIGTERM', value: 15 }
];

function handleTerminalSignal (log, signal, value) {
    log.info(signal + ' received, terminating process ' + process.pid);
    process.exit(128 + value);
}

function createWorkers (count, options, log) {
    var respawnCount, respawnLimit, respawnDelay, i;

    respawnCount = 0;
    respawnLimit = getOption('maxRespawn', options);
    respawnDelay = getOption('delayRespawn', options);

    cluster.on('online', function (worker) {
        log.info('worker ' + worker.process.pid + ' started');
    });

    cluster.on('exit', function (worker, code, signal) {
        var exitStatus = getExitStatus(code, signal);

        if (worker.exitedAfterDisconnect) {
            return log.info('worker ' + worker.process.pid + ' exited (' + exitStatus + ')');
        }

        respawnCount += 1;

        if (respawnLimit > 0 && respawnCount > respawnLimit) {
            return log.error('exceeded respawn limit, worker ' + worker.process.pid + ' died (' + exitStatus + ')');
        }

        setTimeout(function () {
            log.warn('worker ' + worker.process.pid + ' died (' + exitStatus + '), respawning');
            cluster.fork();
        }, respawnDelay);
    });

    for (i = 0; i < count; i += 1) {
        cluster.fork();
    }
}

function getExitStatus (code, signal) {
    if (check.assigned(signal)) {
        return 'signal ' + signal;
    }

    return 'code ' + code;
}

function createServer (options, log) {
    var host, port, path, handler, server;

    host = getHost(options);
    port = getPort(options);
    path = getPath(options);

    log.info('listening for ' + host + ':' + port + path);

    handler = handleRequest.bind(
        null,
        log,
        path,
        getReferer(options),
        getLimit(options),
        getOrigin(options),
        getMaxSize(options),
        getValidator(options),
        getFilter(options),
        getMapper(options),
        getForwarder(options)
    );

    if (options.https) {
        server = https.createServer(getHttpsOptions(options), handler);
    } else {
        server = http.createServer(handler);
    }

    server.listen(port, host);
}

function getHost (options) {
    return getOption('host', options);
}

function getPort (options) {
    if (options.port) {
        return options.port;
    }

    if (options.https) {
        return 443;
    }

    return 80;
}

function getPath (options) {
    return getOption('path', options);
}

function getReferer (options) {
    return getOption('referer', options);
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

function getOrigin (options) {
    return getOption('origin', options);
}

function getMaxSize (options) {
    return getOption('maxSize', options);
}

function getValidator (options) {
    return getExtension('validator', options);
}

function getExtension (type, options, properties) {
    var name, extension, result;

    name = getOption(type, options);

    try {
        extension = require('./' + type + 's/' + name);
    } catch (e) {
        extension = require(name);
    }

    result = extension.initialise(options);

    if (check.array(properties)) {
        properties.forEach(function (property) {
            result[property] = extension[property];
        });
    }

    return result;
}

function getFilter (options) {
    return getExtension('filter', options);
}

function getMapper (options) {
    return getExtension('mapper', options, ['type','separator']);
}

function getForwarder (options) {
    return getExtension('forwarder', options);
}

function getHttpsOptions (options) {
    if (options.httpsPfx) {
        return {
            pfx: options.httpsPfx,
            passphrase: options.httpsPass,
            ciphers: tlsCiphers,
            honorCipherOrder: true
        };
    }

    return {
        key: fs.readFileSync(options.httpsKey),
        cert: fs.readFileSync(options.httpsCert),
        passphrase: options.httpsPass,
        ciphers: tlsCiphers,
        honorCipherOrder: true
    };
}

function handleRequest (log, path, referer, limit, origin, maxSize, validator, filter, mapper, forwarder, request, response) {
    var requestPath, remoteAddress, state;

    logRequest(log, request);

    if (toobusy()) {
        return fail(log, request, response, 503, 'Server too busy');
    }

    requestPath = getRequestPath(request);
    remoteAddress = getRemoteAddress(request);

    if (!checkRequest(log, path, referer, limit, requestPath, remoteAddress, request, response)) {
        return;
    }

    response.setHeader('Access-Control-Allow-Origin', getAccessControlOrigin(request.headers, origin));

    state = {
        body: ''
    };

    request.on('data', receive.bind(null, log, state, maxSize, request, response));
    request.on('end', send.bind(null, log, state, remoteAddress, validator, filter, mapper, forwarder, request, response));
}

function logRequest (log, request) {
    log.info(
        'referer=' + (request.headers.referer || '') + ' ' +
        'user-agent=' + request.headers['user-agent'] + ' ' +
        'address=' + request.socket.remoteAddress + '[' + (request.headers['x-forwarded-for'] || '') + ']' + ' ' +
        'method=' + request.method + ' ' +
        'url=' + request.url
    );
}

function getRequestPath (request) {
    var queryIndex = request.url.indexOf('?');

    return queryIndex === -1 ? request.url : request.url.substr(0, queryIndex);
}

function getRemoteAddress (request) {
    var proxiedAddresses = request.headers['x-forwarded-for'], filteredAddresses;

    if (proxiedAddresses) {
        filteredAddresses = proxiedAddresses.split(',').map(function (address) {
            return address.trim();
        }).filter(check.unemptyString);

        if (filteredAddresses.length > 0) {
            return filteredAddresses[0];
        }
    }

    return request.socket.remoteAddress;
}

function checkRequest (log, path, referer, limit, requestPath, remoteAddress, request, response) {
    if (request.method !== 'GET' && request.method !== 'POST') {
        fail(log, request, response, 405, 'Invalid method `' + request.method + '`');
        return false;
    }

    if (requestPath !== path) {
        fail(log, request, response, 404, 'Invalid path `' + requestPath + '`');
        return false;
    }

    if (check.unemptyString(request.headers.referer) && !referer.test(request.headers.referer)) {
        fail(log, request, response, 403, 'Invalid referer `' + request.headers.referer + '`');
        return false;
    }

    if (request.method === 'POST' && !isValidContentType(request.headers['content-type'])) {
        fail(log, request, response, 415, 'Invalid content type `' + request.headers['content-type'] + '`');
        return false;
    }

    if (!checkLimit(limit, remoteAddress)) {
        fail(log, request, response, 429, 'Exceeded rate `' + limit.time + '`');
        return false;
    }

    return true;
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

function checkLimit (limit, remoteAddress) {
    var now, lastRequest;

    if (limit === null) {
        return true;
    }

    now = Date.now();
    lastRequest = limit.requests[remoteAddress];

    if (check.positive(lastRequest) && now <= lastRequest + limit.time) {
        return false;
    }

    limit.requests[remoteAddress] = now;

    return true;
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

function send (log, state, remoteAddress, validator, filter, mapper, forwarder, request, response) {
    var data, referer, userAgent, mappedData;

    if (state.failed) {
        return;
    }

    try {
        data = parseData(request, state);
        referer = request.headers.referer;
        userAgent = request.headers['user-agent'];

        if (!validator(data, referer, userAgent, remoteAddress)) {
            throw null;
        }

        mappedData = mapper(filter(data), referer, userAgent, remoteAddress);
        if (mappedData === '') {
            return pass(log, response, 204, 0);
        }

        log.info('sending ' + mappedData);

        forwarder(mappedData, mapper.type, mapper.separator, function (error, bytesSent) {
            if (error) {
                log.error(error.stack || error.message || error);
                return fail(log, request, response, 502, 'Forwarder failed');
            }

            pass(log, response, state.successStatus, bytesSent);
        });
    } catch (error) {
        fail(log, request, response, 400, 'Invalid data');

        if (error) {
            log.error(error.stack);
        }
    }
}

function parseData (request, state) {
    if (request.method === 'GET') {
        state.successStatus = 204;
        return qs.parse(url.parse(request.url).query, { allowDots: true });
    }

    state.successStatus = 200;

    if (state.body.substr(0, 5) === 'data=') {
        state.body = state.body.substr(5);
    }

    
    if (request.headers['content-type'] === 'text/plain') {
		state.body = decodeURIComponent(state.body);
        return JSON.parse(state.body);
    }

    return qs.parse(state.body, { parameterLimit: Infinity });
}

function pass (log, response, status, bytes) {
    log.info('sent ' + bytes + ' bytes');

    response.statusCode = status;
    response.end();
}

