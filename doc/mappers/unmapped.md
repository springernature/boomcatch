# mappers/unmapped

The unmapped mapper
serialises the data
in its raw format.
That raw format
looks like this:

```js
{
    "data": {},       // Parsed boomerang request data
    "referer": "",    // HTTP referer header
    "userAgent": "",  // User agent string
    "browser": {
        "name": "",   // Browser name
        "version": "" // Browser major rev
    }
}
```

