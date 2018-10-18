# mappers/har

The har mapper transforms beacon data into a reduced subset of the [HTTP archive format][har]. It only maps data if both the navigation timing plugin and the resource timing plugin have included data in the beacon request.

This mapper only generates a reduced subset because many of the mandatory fields required by the HAR spec are not available in the beacon request data. In those cases, the values are set to `''` (for string properties) or `-1` (for numbers).

If your client code adds a `title` parameter to the beacon request with `BOOMR.addVar()`, that value will be used for the `log.pages.title` field. Otherwise, the page URL will be used.

This mapper also exports a data type, `'json'`, for use by forwarders.

[har]: http://www.softwareishard.com/blog/har-12-spec/
