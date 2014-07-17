#!/usr/bin/env node

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

/*globals require, process, console */

'use strict';

var cli = require('commander'),
    check = require('check-types'),
    packageInfo = require('../package.json'),
    impl = require('./index');

parseCommandLine();
runServer();

function parseCommandLine () {
    cli.version(packageInfo.version)
        .option('-n, --host <name>', 'host name to accept HTTP connections on, default is 0.0.0.0 (INADDR_ANY)')
        .option('-p, --port <port>', 'port to accept HTTP connections on, default is 80', parseInt)
        .option('-u, --path <path>', 'URL path to accept requests to, default is /beacon')
        .option('-r, --referer <regex>', 'HTTP referers to accept requests from, default is .*', parseRegExp)
        .option('-o, --origin <origin>', 'URL(s) for the Access-Control-Allow-Origin header, default is * (any origin), specify null to force same origin', parseOrigin)
        .option('-l, --limit <milliseconds>', 'minimum elapsed time between requests from the same IP address, default is 0', parseInt)
        .option('-z, --maxSize <bytes>', 'maximum allowable body size for POST requests, default is -1 (unlimited)', parseInt)
        .option('-s, --silent', 'prevent the command from logging output to the console')
        .option('-y, --syslog <facility>', 'use syslog-compatible logging, with the specified facility level')
        .option('-w, --workers <count>', 'use a fixed number of worker processes to handle requests, default is -1 (one worker per CPU)', parseInt)
        .option('-v, --validator <path>', 'validator to use, default is permissive')
        .option('-i, --filter <path>', 'filter to use, default is unfiltered')
        .option('-m, --mapper <path>', 'data mapper to use, default is statsd')
        .option('-x, --prefix <prefix>', 'prefix to apply to mapped metric names')
        .option('-T, --svgTemplate <path>', 'path to alternative SVG handlebars template file (SVG mapper only)')
        .option('-S, --svgSettings <path>', 'path to alternative SVG settings JSON file (SVG mapper only)')
        .option('-f, --forwarder <path>', 'forwarder to use, default is udp')
        .option('-N, --fwdHost <name>', 'host name to forward data to (UDP only)')
        .option('-P, --fwdPort <port>', 'port to forward data on (UDP only)', parseInt)
        .option('-Z, --fwdSize <bytes>', 'maximum allowable packet size for data forwarding (UDP only)', parseInt)
        .option('-U, --fwdUrl <name>', 'URL to forward data to (HTTP only)')
        .option('-M, --fwdMethod <name>', 'method to forward data with (HTTP only)')
        .option('-D, --fwdDir <path>', 'directory to write data to (file forwarder only)')
        .option('-k, --key <path>', 'path to private key for secure connection, default is "" (HTTPS only)')
        .option('-c, --cert <path>', 'path to public key for secure connection, default is "" (HTTPS only)')
        .option('--pfx <string>', 'string containing the private key, certificate and CA certs of the server in PFX or PKCS12 format, default is ""')
        .option('--passphrase <string>', 'passphrase for the private key or pfx, default is ""')
        .option('--ca <array>', 'array of strings of trusted certificates in PEM format, default is empty array')
        .option('--crl <array>', 'array of strings of PEM encoded CRLs, default is empty array')
        .option('--ciphers <string>', 'string describing the ciphers to use or exclude, default is "AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH"')
        .option('--handshakeTimeout <milliseconds>', 'abort the connection if the SSL/TLS handshake does not finish in this many milliseconds, default is 120', parseInt)
        .option('--honorCipherOrder <number>', 'use the cipher order added with the ciphers argument, default is 0', parseInt)
        .option('--requestCert <number>', 'if true the server will request a certificate from clients that connect and attempt to verify that certificate, default is 0', parseInt)
        .option('--rejectUnauthorized <number>', 'if true the server will reject any connection which is not authorized with the list of supplied CAs, default is 0', parseInt)
        .option('--NPNProtocols <array>', 'array of possible NPN protocols, default is empty array')
        .option('--SNICallback <function>', 'function that will be called if client supports SNI TLS extension')
        .option('--sessionIdContext <string>', 'string containing a opaque identifier for session resumption, default is MD5 hash value generated from command-line, otherwise, the default is not provided')
        .option('--secureProtocol <string>', 'SSL method to use')
        .parse(process.argv);
}

function parseRegExp (regExp) {
    return new RegExp(regExp);
}

function parseOrigin (origin) {
    var array = origin.split(',');

    if (array.length === 1) {
        return origin;
    }

    return array.map(function (item) {
        return item.trim();
    });
}

function runServer () {
    if (!cli.silent) {
        cli.log = getLog();
    }

    normaliseWorkers();

    impl.listen(getOptions());
}

function getLog () {
    if (cli.syslog) {
        initialiseSyslog();
        return console;
    }
    
    return getFallbackLog();
}

function initialiseSyslog () {
    try {
        require('rconsole');

        console.set({
            facility: cli.syslog,
            title: 'boomcatch',
            stdout: true,
            stderr: true,
            showLine: false,
            showFile: false,
            showTime: true
        });
    } catch (e) {
        console.log('Failed to initialise syslog, exiting.');
        process.exit(1);
    }
}

function getFallbackLog () {
    return require('get-off-my-log').initialise('boomcatch', console.log);
}

function normaliseWorkers () {
    if (check.not.number(cli.workers) || cli.workers < 0) {
        cli.workers = require('os').cpus().length;
    }
}

function getOptions () {
    return Object.keys(cli).reduce(function (options, key) {
        if (key.charAt(0) !== '_' && key !== 'commands' && key !== 'options' && key !== 'rawArgs' && key !== 'args') {
            options[key] = cli[key];
        }

        return options;
    }, {});
}

