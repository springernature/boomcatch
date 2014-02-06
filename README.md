# boomcatch

[![Build status][ci-image]][ci-status]

Standalone,
node.js-based
beacon server for boomerang/kylie.

* [Installation](#installation)
    * [At the system level](#at-the-system-level)
    * [Local to a node.js project](#local-to-a-nodejs-project)
* [Usage](#usage)
    * [From the command line](#from-the-command-line)
    * [From a node.js project](#from-a-nodejs-project)
    * [Data mappers](#data-mappers)
    * [Data forwarders](#data-forwarders)
* [Development](#development)
* [Change log](#change-log)
* [License](#license)

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

* `--silent`:
  Prevent the command
  from logging output
  to the console.

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

* `--fwdPort <port>`:
  Port to forward mapped data on.
  The default is 8125.

### From a node.js project

```javascript
var path = require('path'),
    boomcatch = require('boomcatch');

boomcatch.listen({
    host: 'rum.example.com',                  // Defaults to '0.0.0.0' (INADDR_ANY)
    port: 8080,                               // Defaults to 80
    path: '/perf',                            // Defaults to '/beacon'
    log: console.log,                         // Defaults to `function () {}`
    mapper: path.resolve('./mymapper'),       // Defaults to 'statsd'
    prefix: 'mystats.rum.',                   // Defaults to ''
    forwarder: path.resolve('./myforwarder'), // Defaults to 'udp'
    fwdHost: '192.168.50.4',                  // Defaults to '127.0.0.1'
    fwdPort: 5001                             // Defaults to 8125
});
```

### Data mappers

Mappers are used
to transform data
into appropriate formats
for back-end stats consumers.
Currently, one mapper is available out-of-the-box,
which formats the metrics
as [statsd] timers.

Defining a custom data mapper
is straightforward.
The [source code for the statsd mapper][mapper]
should be easy to follow,
but the basic pattern
is to export an interface
that looks like this:

```javscript
{
    initialise: function (options) {
    }
}
```

The `initialise` function
should return a function
that is passed a data object
as its only parameter
and returns the mapped data.

If you then specify
the path to your new mapper
with the `mapper` option,
a first attempt to load it
is made relative
to this project's `src/mappers` directory.
When that call to `require` fails,
a second attempt will be made
using the path that you specified verbatim.

### Data forwarders

Forwarders are used
to send mapped data
to back-end stats consumers.
Currently, one forwarder is available out-of-the-box,
which dispatches the data over UDP.

Defining a custom forwarder
takes broadly the same form
as [defining a custom mapper](#data-mappers)
and can be seen
in the [source code for the udp forwarder][forwarder].
Again, the module should export
an interface that looks like this:

```javscript
{
    initialise: function (options) {
    }
}
```

In this case,
the `initialise` function
should return a function
that is passed
the mapped data
and a callback function
as its two parameters.
When the forwarding process has completed,
the callback function should be invoked,
following the node.js convention
of the first argument containing any error,
or a falsey value if things went okay.
The second argument should contain
the number of bytes that were sent.

Once your custom forwarder is ready,
you can specify the path to it
using the `forwarder` option.

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

[MIT][license]

[ci-image]: https://secure.travis-ci.org/nature/boomcatch.png?branch=master
[ci-status]: http://travis-ci.org/#!/nature/boomcatch
[node]: http://nodejs.org/download/
[require]: http://nodejs.org/api/globals.html#globals_require
[statsd]: https://github.com/etsy/statsd/
[mapper]: https://github.com/nature/boomcatch/blob/master/src/mappers/statsd.js
[forwarder]: https://github.com/nature/boomcatch/blob/master/src/forwarders/udp.js
[contrib]: https://github.com/nature/boomcatch/blob/master/CONTRIBUTING.md
[history]: https://github.com/nature/boomcatch/blob/master/HISTORY.md
[license]: https://github.com/nature/boomcatch/blob/master/COPYING

