# Node static proxy

Simplistic node server for serving static content with proxy fallback.

## Usage

    node app.js <port> <proxy-port> [proxy-host] [root-dir]

## Features

* A single 100-line file.
* No dependencies outside the standard libary.
* If the URL matches a directory, the special file `index` is served.

## Missing features

* Content type isn't set.

## Future ideas

* It should be possible to serve different files based on the HTTP method,
  `Accepts` header, etc.
* Add option for using configuration files embedded in the file system
  hierarchy to modify request handling.
* Add templating capabilities for allowing static files to act as simple
  request handlers.
