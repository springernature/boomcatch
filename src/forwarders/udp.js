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
    return send.bind(null, normaliseHost(options.fwdHost), normalisePort(options.fwdPort), normaliseSize(options.fwdSize));
};

function normaliseHost (host) {
    return normaliseValue(host, 'unemptyString', '127.0.0.1');
}

function normaliseValue (value, test, defaultValue) {
    if (check[test](value)) {
        return value;
    }

    return defaultValue;
}

function normalisePort (port) {
    return normaliseValue(port, 'positiveNumber', 8125);
}

function normaliseSize (size) {
    return normaliseValue(size, 'positiveNumber', 512);
}

function send (host, port, size, data, type, separator, callback) {
    var socket, buffer;

    try {
        if (size > 0 && data.length > size) {
            return chunkData(data, size, separator || '', []).forEach(function (chunk) {
                send(host, port, size, chunk, separator, callback);
            });
        }

        socket = udp.createSocket('udp4');
        buffer = new Buffer(data);

        socket.send(buffer, 0, buffer.length, port, host, function (error, bytesSent) {
            socket.close();

            callback(error, bytesSent);
        });
    } catch (error) {
        callback(error.message);
    }
}

function chunkData (data, size, separator, chunks) {
    var i;

    if (data.length <= size) {
        chunks.push(data);
        return chunks;
    }

    if (separator !== '') {
        for (i = size; i > 0; i -= 1) {
            if (data.substr(i, separator.length) === separator) {
                return chunkDataAtIndex(data, i, separator.length, size, separator, chunks);
            }
        }
    }

    return chunkDataAtIndex(data, size, 0, size, separator, chunks);
}

function chunkDataAtIndex(data, index, gap, size, separator, chunks) {
    chunks.push(data.substring(0, index));
    return chunkData(data.substring(index + gap), size, separator, chunks);
}

