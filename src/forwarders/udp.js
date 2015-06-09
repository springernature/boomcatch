// Copyright © 2014, 2015 Nature Publishing Group
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
    return normaliseValue(port, 'positive', 8125);
}

function normaliseSize (size) {
    return normaliseValue(size, 'positive', 512);
}

function send (host, port, size, data, type, separator, callback) {
    var count = 0, length = 1, socket, chunks, failed;

    socket = udp.createSocket('udp4');

    if (data.length <= size) {
        return sendToSocket(data);
    }

    chunks = chunkData(data, size, separator || '', []);
    length = chunks.length;
    chunks.forEach(sendToSocket);

    function sendToSocket (data) {
        var buffer = new Buffer(data);
        socket.send(buffer, 0, buffer.length, port, host, finish);
    }

    function finish (error, bytesSent) {
        if (error && !failed) {
            callback(error);
            failed = true;
        }

        count += 1;

        if (count === length) {
            socket.close();

            if (!failed) {
                callback(null, bytesSent);
            }
        }
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

