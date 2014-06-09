# mappers/waterfall

The waterfall mapper
transforms resource timing data
into an HTML document
containing an [SVG] waterfall chart,
similar to the waterfall charts
that can be found
in many web browser developer tools.

It accepts two options,
`svgTemplate`
(`-T` from the command line),
which allows you
to specify a path
to the template
that will be rendered,
and `svgSettings`
(`-S` from the command line),
which enables you
to override
some of the visual aspects
of the waterfall chart,
including size, colours and padding.

This mapper also exports
a data type,
`'html'`,
for use by forwarders.

[svg]: https://developer.mozilla.org/en/docs/Web/SVG

