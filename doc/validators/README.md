# Validators

Validators are the first stage of the [extension pipeline][extensions], called before [filters], [mappers] and [forwarders]. Their purpose is to check the request, then signal whether to continue processing or fail. A common reason to define your own validator is to implement nonce validation, as a preventative measure against denial-of-service attacks. If the validator returns `true`, processing continues and the remaining extensions are invoked. If it returns `false`, processing is terminated and the request fails with HTTP status 400.

The choice of validator can be specified on the command line with the `-v` [option]. One validator is available by default, `permissive`, which always returns `true` without performing any checks on the data.

Defining custom validators is simple. The basic pattern is to export an interface that looks like this:

```javascript
{
	initialise: function (options) {
	}
}
```

Where `initialise` is a function that takes an options object and returns the validator function, bound to any pertinent options. The signature for the returned validator function should look like this:

```javascript
function (/* bound options, ... */ data, referer, userAgent, remoteAddress) {
}
```

The remaining/unbound arguments passed to the mapper are, in order:

1. `data`: Request data, parsed into an object.
2. `referer`: URL of the page that sent the beacon request.
3. `userAgent`: User agent string of the client that sent the beacon request.
4. `remoteAddress`: IP address of the client that sent the beacon request.

The validator function should return `true` if the request is okay, `false` otherwise.

[extensions]: ../extensions.md
[filters]: ../filters/README.md
[mappers]: ../mappers/README.md
[forwarders]: ../forwarders/README.md
[option]: ../../README.md#from-the-command-line
