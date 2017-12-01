# express-unpkg [![Travis][build-badge]][build] [![npm package][npm-badge]][npm]

> this is a fork of `github.com/unpkg/express-unpkg`

[build-badge]: https://img.shields.io/travis/unpkg/express-unpkg/master.svg?style=flat-square
[build]: https://travis-ci.org/unpkg/express-unpkg

[npm-badge]: https://img.shields.io/npm/v/express-unpkg.svg?style=flat-square
[npm]: https://www.npmjs.org/package/express-unpkg

express-unpkg is an [express](http://expressjs.com/) server that serves files from npm packages.

## Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save express-unpkg

Then, use as you would anything else:

```js
// using ES modules
import { createServer } from 'express-unpkg'

// using CommonJS modules
var createServer = require('express-unpkg').createServer
```

## Configuration and Usage

Use `createServer` to create a server instance, passing it the options it needs to connect to [npm](https://npmjs.org):

```js
import { createServer } from 'express-unpkg'

const server = createServer({
  registryURL: 'https://registry.npmjs.org',  // The URL of the npm registry, defaults to the public registry
  bowerBundle: '/bower.zip',                  // A special pathname for generating Bower bundles, defaults to "/bower.zip"
  redirectTTL: 60,                            // The time (in seconds) to cache 302 responses, defaults to 0
  autoIndex: true                             // Set false to disable generating index pages for directories
})

server.listen(8080)
```

`server` is a standard [node HTTP server](https://nodejs.org/api/http.html#http_class_http_server).

If you'd like to use express-unpkg as part of a larger [express](http://expressjs.com/) site, you can use the `createRequestHandler` function directly. As its name suggests, this function returns another function that can be used as the request handler in a standard express server. This function accepts the same options as `createServer`.

```js
import express from 'express'
import { createRequestHandler } from 'express-unpkg'

const app = express()
app.use(express.static('public'))
app.use(createRequestHandler())

// ...
```

## URL Format

In express-unpkg, the URL is the API. The server recognizes URLs in the format `/package@version/path/to/file` where:

    package         The @scope/name of an npm package (scope is optional)
    version         The version, version range, or tag
    /path/to/file   The path to a file in that package (optional, defaults to main module)

## Debugging

To enable debug console output, set `DEBUG=express-unpkg` in your environment.
