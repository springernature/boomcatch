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

/*globals require, exports, Buffer */

'use strict';

var check = require('check-types'),
    udp = require('dgram');

exports.initialise = function (options) {
    return send.bind(null, normaliseHost(options.fwdHost), normalisePort(options.fwdPort));
};

function normaliseHost (host) {
    if (check.unemptyString(host)) {
        return host;
    }

    return '127.0.0.1';
}

function normalisePort (port) {
    if (check.positiveNumber(port)) {
        return port;
    }

    return 8125;
}

function send (host, port, data, callback) {
    var socket, buffer;

    socket = udp.createSocket('udp4');
    buffer = new Buffer(data);

    socket.send(buffer, 0, buffer.length, port, host, function (error, bytesSent) {
        socket.close();

        callback(error, bytesSent);
    });
}

