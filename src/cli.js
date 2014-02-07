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

/*globals require, process */

'use strict';

var cli = require('commander'),
    packageInfo = require('../package.json'),
    impl = require('./index');

parseCommandLine();
runServer();

function parseCommandLine () {
    cli.version(packageInfo.version)
        .option('-n, --host <name>', 'host name to accept HTTP connections on, default is 0.0.0.0 (INADDR_ANY)')
        .option('-p, --port <port>', 'port to accept HTTP connections on, default is 8008', parseInt)
        .option('-u, --path <path>', 'URL path to accept requests to, default is /beacon')
        .option('-s, --silent', 'prevent the command from logging output to the console')
        .option('-m, --mapper <path>', 'data mapper to use, default is statsd')
        .option('-x, --prefix <prefix>', 'prefix to apply to mapped metric names')
        .option('-f, --forwarder <path>', 'forwarder to use, default is udp')
        .option('-N, --fwdHost <name>', 'host name to forward data to')
        .option('-P, --fwdPort <port>', 'port to forward data on', parseInt)
        .parse(process.argv);
}

function runServer () {
    if (!cli.silent) {
        cli.log = console.log.bind(console);
    }

    impl.listen(cli);
}

