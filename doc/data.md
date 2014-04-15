# Data

Before being passed through
the extension pipeline,
data from each beacon request
is normalised into a uniform structure
that lends itself better
to automated processing.

Essentially, that structure
looks like this:

```javascript
{
    rt: {
        timestamps: {},
        events: {},
        durations: {}
    },
    navtiming: {
        timestamps: {},
        events: {},
        durations: {}
    },
    restiming: {
        timestamps: {},
        events: {},
        durations: {}
    }
}
```

It is a nested object hierarchy,
where the first layer of properties
correspond to boomerang plugins.
Currently only the
round trip,
navigation timing
and resource timing
plugins are modelled
in this structure.

Each plugin object
has three children,
`timestamps`,
`events`
and `durations`:

* `timestamps`:
  Each property of this object
  is an integer
  representing milliseconds
  since the epoch
  (00:00:00 UTC
  1st January 1970).

* `events`:
  Each property of this object
  is an object
  with `start`
  and `end`
  timestamp properties.

* `durations`:
  Each property of this object
  is an integer
  representing the number of milliseconds
  between the `start` timestamp
  and some other point.

Grouping
the different types of metric
in this way
enables data mappers
to be implemented
without requiring
magical knowledge
about the metric names
exported by each plugin.

