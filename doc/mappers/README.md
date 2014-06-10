# Mappers

Mappers are the third stage
of the [extension pipeline][extensions],
called after [validators] and [filters]
but before [forwarders].
Their purpose is to transform beacon data
into an appropriate format
to be consumed by some other process.

The choice of mapper
can be specified at the command line,
using the `-m` [option].
Three mappers are availble out-of-the-box,
[statsd], [statsd-npg], [har] and [waterfall].

Defining custom mappers is simple.
The [source code for the statsd mapper][src]
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

Where `initialise` is a function
that takes an options object
and returns the mapper function,
bound to any pertinent options.
The signature for
the returned mapper function
should look like this:

```javascript
function (/* bound options, ... */ data, referer, userAgent, remoteAddress) {
}
```

The remaining/unbound arguments
passed to the mapper
are, in order:

1. `data`:
   [Normalised] and filtered data.

2. `referer`:
   URL of the page
   that sent the beacon request.

3. `userAgent`:
   User agent string of the client
   that sent the beacon request.

4. `remoteAddress`:
   IP address of the client
   that sent the beacon request.

The result of
the mapper function
should be a string
containing the mapped data.

In addition to
the `initialise` function,
mappers may optionally expose
a `separator` property,
which can be used by forwarders
to ensure sane data-chunking behaviour
in the event that
they are required
to break data
across multiple packets
before sending it on.
For example,
the `statsd` mapper
defines `separator`
as `'\n'`.

[extensions]: ../extensions.md
[validators]: ../validators/README.md
[filters]: ../filters/README.md
[forwarders]: ../forwarders/README.md
[option]: ../../README.md#from-the-command-line
[statsd]: statsd.md
[statsd-npg]: statsd-npg.md
[har]: har.md
[waterfall]: waterfall.md
[src]: ../../src/mappers/statsd.js
[normalised]: ../data.md

