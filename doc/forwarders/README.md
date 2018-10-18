# Forwarders

Forwarders are the fourth and final stage of the [extension pipeline][extensions], after [validators], [filters] and [mappers]. Their purpose is to send mapped data onto some other process.

The choice of forwarder can be specified at the command line, using the `-f` [option].

Three forwarders are available out-of-the-box, [udp], [http], [file] and [console].

Defining custom mappers is simple. The [source code for the udp forwarder][src] should be easy to follow, but the basic pattern is to export an interface that looks like this:

```javascript
{
	initialise: function (options) {
	}
}
```

Where `initialise` is a function that takes an options object and returns the forwarder function, bound to any pertinent options. The signature for the returned forwarder function should look like this:

```javascript
function (/* bound options, ... */ data, type, separator, callback) {
}
```

The remaining/unbound arguments passed to the mapper are, in order:

1. `data`: Data returned by one of the mappers.
2. `type`: Optional type that can be used to ensure sane transfer of the data.
3. `separator`: Optional separator that can be used to ensure sane chunking of data, in the event that it must be broken across multiple packets.
4. `callback`: Function to call after the data has been sent. The signature for this function should look like this:

```javascript
function (error, bytes) {
}
```

This conforms to the node.js convention of the first argument containing any error, or a falsey value if things went okay. The second argument should contain the number of bytes that were sent.

[extensions]: ../extensions.md
[validators]: ../validators/README.md
[filters]: ../filters/README.md
[mappers]: ../mappers/README.md
[option]: ../../README.md#from-the-command-line
[udp]: udp.md
[http]: http.md
[file]: file.md
[console]: console.md
[src]: ../../src/forwarders/udp.js
