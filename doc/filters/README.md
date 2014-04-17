# Filters

Filters are the second stage
of the [extension pipeline][extensions],
called after [validators]
and before [mappers] and [forwarders].
Their purpose
is to purge
unwanted parts of the data,
so that only
the required data
is mapped and forwarded.

The choice of filter
can be specified at the command line,
using the `-i` [option].
One filter is available by default,
`unfiltered`,
which simply returns the data
it receives unmodified.

Defining custom filters
is easy.
The basic pattern
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
and returns the filter function,
bound to any pertinent options.
The signature for
the returned filter function
should look like this:

```javascript
function (/* bound options, ... */ data) {
}
```

Where `data`
is the beacon data
in [normalised format][data].

The filter function
should return
the filtered data object.

[extensions]: ../extensions.md
[validators]: ../validators/README.md
[mappers]: ../mappers/README.md
[forwarders]: ../forwarders/README.md
[option]: ../../README.md#from-the-command-line
[data]: ../data.md

