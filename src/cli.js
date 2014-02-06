#!/usr/bin/env node

/*globals require, process */

'use strict';

var cli = require('commander'),
    packageInfo = require('../package.json'),
    impl = require('./index');

parseCommandLine();
runServer();

function parseCommandLine () {
    cli.version(packageInfo.version)
        .option('-n, --host <hostname>', 'hostname to accept HTTP connections on, default is 0.0.0.0 (INADDR_ANY)')
        .option('-p, --port <port>', 'port to accept HTTP connections on, default is 8008', parseInt)
        .option('-u, --path <path>', 'URL path to accept requests to, default is /beacon')
        .option('-s, --silent', 'prevent the command from logging output to the console')
        .option('-m, --mapper <path>', 'data mapper to use, default is statsd')
        .option('-x, --prefix <prefix>', 'prefix to apply to mapped metric names')
        .option('-f, --forwarder <path>', 'forwarder to use, default is forwarders/udp')
        .option('-N, --fwdHost <hostname>', 'hostname to forward data to')
        .option('-P, --fwdPort <port>', 'port to forward data on', parseInt)
        .parse(process.argv);
}

function runServer () {
    if (!cli.silent) {
        cli.log = console.log.bind(console);
    }

    impl.listen(cli);
}

