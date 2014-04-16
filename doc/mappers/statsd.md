# mappers/statsd

The statsd mapper
transforms beacon data
into [statsd][statsd] [timers][timers].
It accepts one option,
`prefix`
(`-x` from the command line),
which allows you
to specify
a namespace
that will be applied
to the beginning
of mapped timer names.
This mapper
also exports
a separator string,
`'\n'`,
for use by forwarders
in the event
that they need to
chunk data into packets
before sending.

Currently,
this mapper will only
translate events and durations
from the [normalised data structure][format].
There is a plan to expand coverage
to incorporate non-`start` timestamps
at some point.

Data from
the round trip plugin
is mapped as follows:

```
<prefix>.rt.firstbyte:<time>|ms
<prefix>.rt.lastbyte:<time>|ms
<prefix>.rt.load:<time>|ms
```

Data from
the navigation timing plugin
is mapped like so:

```
<prefix>.navtiming.unload:<time>|ms
<prefix>.navtiming.redirect:<time>|ms
<prefix>.navtiming.dns:<time>|ms
<prefix>.navtiming.connect:<time>|ms
<prefix>.navtiming.response:<time>|ms
<prefix>.navtiming.dom:<time>|ms
<prefix>.navtiming.domContent:<time>|ms
<prefix>.navtiming.load:<time>|ms
```

The mapping of
resource timing data
is currently somewhat experimental
and liable to change
in future versions.
It features a
base-36 encoding
of page and resource URLs,
to make them compatible
with statsd namespaces.
The mapped data
looks like this:

```
<prefix>.restiming.<encoded page url>.<resource index>.<initiator type>.<encoded resource url>.redirect:<time>|ms
<prefix>.restiming.<encoded page url>.<resource index>.<initiator type>.<encoded resource url>.dns:<time>|ms
<prefix>.restiming.<encoded page url>.<resource index>.<initiator type>.<encoded resource url>.connect:<time>|ms
<prefix>.restiming.<encoded page url>.<resource index>.<initiator type>.<encoded resource url>.response:<time>|ms
```

Here is
a reference implementation
of a function
for decoding
the base-36 encoded URLs:

```javascript
function decodeBase36 (encoded, decoded) {
    if (!decoded) {
        decoded = '';
    }

    if (encoded === '') {
        return decoded;
    }

    return decodeBase36(encoded.substr(2), decoded + String.fromCharCode(parseInt(encoded.substr(0, 2), 36)));
}
```

It should be called
with one argument,
the base-36 encoded string.

[statsd]: https://github.com/etsy/statsd
[timers]: https://github.com/etsy/statsd/blob/master/docs/metric_types.md#timing
[format]: ../data.md

