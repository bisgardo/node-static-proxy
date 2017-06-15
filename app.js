'use strict';

var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

// Config parameters.
var config = {
    incomingPort: null,
    outgoingPort: null,
    outgoingHost: 'localhost',
    root: '.'
};

function parseConfig(args) {
    var keys = ['incomingPort', 'outgoingPort', 'outgoingHost', 'root']
    args.forEach(function (arg, index) {
        var key = keys[index];
        config[key] = arg;
    });
}

var args = process.argv.slice(2);
parseConfig(args);

// Validate config parameters.
if (!config.incomingPort) {
    console.log('Error: missing incoming port');
    process.exit(1);
}
if (!config.outgoingPort) {
    console.log('Error: missing outgoing port');
    process.exit(1);
}

// Set up server.
http.createServer(function (req, res) {
    var files = searchPath(req);
    var result = readFirstExisting(files);
    if (result !== null) {
        var file = result.file;
        var contents = result.contents;
        
        // TODO Should probably set content type...
        console.log('Serving', file)
        return res.end(contents);
    }
    
    var proxyReq = proxy(req, res);
    console.log('Proxying to', proxyReq.method, proxyReq.path);
}).listen(config.incomingPort, function () {
    console.log('Listening on port', config.incomingPort);
    console.log('Proxying to', config.outgoingHost + ':' + config.outgoingPort);
    console.log('Serving directory', config.root);
});

function searchPath(req) {
    var urlPath = url.parse(req.url).pathname;
    var filePath = path.join(config.root, urlPath);
    // TODO Use `req` (method, headers, etc.) to create more precise matches.
    return [
        filePath,
        path.join(filePath, 'index')
    ];
}

function readFirstExisting(files) {
    for (var index in files) {
        var file = files[index];
        try {
            var contents = fs.readFileSync(file, 'utf-8')
            return {file: file, contents: contents};
        } catch (ignored) {
        }
    }
    return null;
}

function proxy(req, res) {
    var method = req.method;
    var url = req.url
    var headers = req.headers;
    
    var options = {
        hostname: config.outgoingHost,
        port: config.outgoingPort,
        path: url,
        method: method,
        headers: headers
    };
    
    var proxyReq = http.request(options, function (proxyRes) {
        // Pipe status code and headers.
        var statusCode = proxyRes.statusCode;
        var headers = proxyRes.headers;
        res.writeHead(statusCode, headers);
        
        // Pipe response body.
        proxyRes.pipe(res);
    }).on('error', function (err) {
        console.error('Failed proxying to', proxyReq.method, proxyReq.path);
        res.statusCode = 502;
        res.end();
    });
    
    req.pipe(proxyReq);
    return proxyReq;
}
