# mappers/statsd

The statsd mapper
transforms beacon data
into [statsd][statsd] [timers][timers].
It accepts one option,
`prefix`
(`--prefix`
or `-x`
from the command line),
which allows you
to specify
a namespace
that will be applied
to the beginning
of mapped timer names.

Currently,
this mapper will only
translate events and durations
from the [normalised data structure][format].
There is a plan to expand coverage
to incorporate non-`start` timestamps
in due course.

Data from
the round trip plugin
is mapped as follows:

```
[<prefix>.]rt.firstbyte:<time>|ms
[<prefix>.]rt.lastbyte:<time>|ms
[<prefix>.]rt.load:<time>|ms
```

Data from
the navigation timing plugin
is mapped like so:

```
[<prefix>.]navtiming.unload:<time>|ms
[<prefix>.]navtiming.redirect:<time>|ms
[<prefix>.]navtiming.dns:<time>|ms
[<prefix>.]navtiming.connect:<time>|ms
[<prefix>.]navtiming.response:<time>|ms
[<prefix>.]navtiming.dom:<time>|ms
[<prefix>.]navtiming.domContent:<time>|ms
[<prefix>.]navtiming.load:<time>|ms
```

Data from
the resource timing plugin
is currently a bit experimental
in this mapper
and liable to change
in a future version.

TODO: Mention base 36 encoding for restiming data
TODO: Mention reference implementation of base 36 decoding

[statsd]: https://github.com/etsy/statsd
[timers]: https://github.com/etsy/statsd/blob/master/docs/metric_types.md#timing
[format]: ../data.md

