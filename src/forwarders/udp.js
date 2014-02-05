'use strict';

/*globals require, exports, Buffer */

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

