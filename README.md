# boomcatch

Standalone,
node.js-based
beacon server for [boomerang].
[Read more][blog].

[![Build status][ci-image]][ci-status]

* **boomcatch version**: *1.4.2*
* **node.js versions**: *0.10, 0.11*

## Installation

### At the system level

First you must
[install node][node].

You can then
install boomcatch via npm:

```
npm install -g boomcatch
```

### Local to a node.js project

Add boomcatch
to the dependencies
in your project's `package.json`,
then run:

```
npm install
```

## Usage

### From the command line

To see
the list of command line options
run:

```
boomcatch --help
```

Available options are:

* `--host <name>`:
  Host name to accept HTTP connections on.
  The default is 0.0.0.0 (INADDR_ANY).

* `--port <port>`:
  Port to accept HTTP connections on.
  The default is 80.

* `--path <path>`:
  URL path to accept requests to.
  The default is /beacon.

* `--referer <regex>`:
  HTTP referers to accept requests from.
  The default is `.*`.

* `--origin <origin>`:
  Comma-separated list of URL(s)
  for the Access-Control-Allow-Origin header.
  The default is * (any origin),
  specify 'null' to force same origin.

* `--limit <milliseconds>`:
  Minimum elapsed time to allow
  between requests from the same IP adderss.
  The default is 0.

* `--maxSize <bytes>`:
  Maximum body size to allow for POST requests.
  The default is -1 (unlimited).

* `--silent`:
  Prevent the command
  from logging output
  to the console.

* `--syslog <facility>`:
  Use [syslog]-compatible logging,
  with the specified facility level.

* `--workers <count>`:
  The number of worker processes to spawn.
  The default is -1
  (one worker per CPU).

* `--validator <path>`:
  Validator used to accept or reject request data.
  The default is permissive
  (always accept requests).

* `--mapper <path>`:
  Data mapper used to transform data before forwarding,
  loaded with [require].
  The default is statsd.

* `--prefix <prefix>`:
  Prefix for mapped metric names.
  The default is the empty string
  (no prefix).

* `--forwarder <path>`:
  Forwarder used to send data,
  loaded with require.
  The default is udp.

* `--fwdHost <name>`:
  Host name to forward mapped data to.
  The default is 127.0.0.1.
  This option is only effective
  with the UDP forwarder.

* `--fwdPort <port>`:
  Port to forward mapped data on.
  The default is 8125.
  This option is only effective
  with the UDP forwarder.

* `--fwdSize <bytes>`:
  Maximum packet size
  for forwarded data.
  The default is 512.
  This option is only effective
  with the UDP forwarder.

* `--fwdUrl <url>`:
  URL to forward mapped data to.
  This option is only effective
  with the HTTP forwarder.

* `--fwdMethod <method>`:
  Method to forward mapped data with.
  The default is GET.
  This option is only effective
  with the HTTP forwarder.

* `--fwdDir <path>`:
  Directory to write mapped data to.
  This option is only effective
  with the file forwarder.

### From a node.js project

```javascript
var path = require('path'),
    boomcatch = require('boomcatch');

boomcatch.listen({
    host: 'rum.example.com',                  // Defaults to '0.0.0.0' (INADDR_ANY)
    port: 8080,                               // Defaults to 80
    path: '/perf',                            // Defaults to '/beacon'
    referer: /^\w+\.example\.com$/,           // Defaults to /.*/
    origin: [                                 // Defaults to '*'
      'http://foo.example.com',
      'http://bar.example.com'
    ],
    limit: 100,                               // Defaults to 0
    maxSize: 1048576,                         // Defaults to -1
    log: console.log,                         // Defaults to function () {}
    workers: require('os').cpus().length,     // Defaults to 0
    validator: path.resolve('./myvalidator'), // Defaults to 'permissive'
    mapper: path.resolve('./mymapper'),       // Defaults to 'statsd'
    prefix: 'mystats.rum.',                   // Defaults to ''
    forwarder: 'http',                        // Defaults to 'udp'
    fwdUrl: 'https://stats.example.com/',     // No default
    fwdMethod: 'POST'                         // Defaults to 'GET'
});
```

## Extensions

Boomcatch implements
four extension points
to control
how beacon requests
are handled:
validators,
filters,
mappers
and forwarders.

[Read more about them here][extensions].

## Development

Before sumitting any pull requests,
please ensure that you have
adhered to the [contribution guidelines][contrib].

To clone the repository:

```
git clone git@github.com:nature/boomcatch.git
```

To set up the development environment:

```
npm install
```

To lint the code:

```
npm run lint
```

To run the unit tests:

```
npm test
```

## Change log

[History]

## License

[GPL 3][license]

Copyright © 2014 Nature Publishing Group

[boomerang]: https://github.com/lognormal/boomerang
[blog]: http://cruft.io/posts/introducing-boomcatch/
[ci-image]: https://secure.travis-ci.org/nature/boomcatch.png?branch=master
[ci-status]: http://travis-ci.org/#!/nature/boomcatch
[node]: http://nodejs.org/download/
[syslog]: http://en.wikipedia.org/wiki/Syslog
[require]: http://nodejs.org/api/globals.html#globals_require
[extensions]: doc/extensions.md
[contrib]: CONTRIBUTING.md
[history]: HISTORY.md
[license]: COPYING

