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

/*globals require, exports */

'use strict';

var url = require('url'),
    querystring = require('querystring'),
    check = require('check-types'),
    contentTypes;

exports.initialise = function (options) {
    return send.bind(null, getProtocol(options.fwdUrl), url.parse(options.fwdUrl), normaliseMethod(options.fwdMethod));
};

function getProtocol (url) {
    return require(url.substr(0, url.indexOf(':')));
}

function normaliseMethod (method) {
    if (check.unemptyString(method)) {
        return method;
    }

    return 'GET';
}

function send (protocol, url, method, data, type, separator, callback) {
    var length, request;

    try {
        if (check.object(data)) {
            data = querystring.stringify(data);
        }

        length = data.length;

        if (method === 'GET') {
            url.path += '?' + data;
            data = null;
        }

        url.method = method;
        url.headers = {
            'Content-Type': contentTypes[type || 'default']
        };

        request = protocol.request(url, function (response) {
            if (data) {
                request.write(data);
            }

            request.end();

            response.on('close', callback.bind(null, null, length));
        });

        request.on('error', callback);
    } catch (error) {
        callback(error);
    }
}

contentTypes = {
    json: 'application/json',
    html: 'text/html',
    default: 'text/plain'
};

