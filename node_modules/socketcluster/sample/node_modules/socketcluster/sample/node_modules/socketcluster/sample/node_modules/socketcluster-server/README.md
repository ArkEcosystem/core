# socketcluster-server
Minimal server module for SocketCluster

This is a stand-alone server module for SocketCluster. This module offers the most flexibility when creating a SocketCluster service but requires the most work to setup.
The repository for the full-featured framework is here: https://github.com/SocketCluster/socketcluster

## Setting up

You will need to install ```socketcluster-server``` and ```socketcluster-client``` (https://github.com/SocketCluster/socketcluster-client) separately.

To install this module:
```npm install socketcluster-server```

## Using with basic http(s) module (example)

You need to attach it to an existing Node.js http or https server (example):
```js
var http = require('http');
var socketClusterServer = require('socketcluster-server');

var httpServer = http.createServer();
var scServer = socketClusterServer.attach(httpServer);

scServer.on('connection', function (socket) {
  // ... Handle new socket connections here
});

httpServer.listen(8000);
```

## Using with Express (example)

```js
var http = require('http');
var socketClusterServer = require('socketcluster-server');
var serveStatic = require('serve-static');
var path = require('path');
var app = require('express')();

app.use(serveStatic(path.resolve(__dirname, 'public')));

var httpServer = http.createServer();

// Attach express to our httpServer
httpServer.on('request', app);

// Attach socketcluster-server to our httpServer
var scServer = socketClusterServer.attach(httpServer);

scServer.on('connection', function (socket) {
  // ... Handle new socket connections here
});

httpServer.listen(8000);
```

Note that the full SocketCluster framework (https://github.com/SocketCluster/socketcluster) uses this module behind the scenes so the API is exactly the same and it works with the socketcluster-client out of the box.
The main difference with using socketcluster-server is that you won't get features like:

- Automatic scalability across multiple CPU cores.
- Resilience; you are responsible for respawning the process if it crashes.
- Convenience; It requires more work up front to get working (not good for beginners).
- Pub/sub channels won't scale across multiple socketcluster-server processes/hosts by default.\*

\* Note that the ```socketClusterServer.attach(httpServer, options);``` takes an optional options argument which can have a ```brokerEngine``` property - By default, socketcluster-server
uses ```sc-simple-broker``` which is a basic single-process in-memory broker. If you want to add your own brokerEngine (for example to scale your socketcluster-servers across multiple cores/hosts), then you might want to look at how sc-simple-broker was implemented.

The full SocketCluster framework uses a different broker engine: ```sc-broker-cluster```(https://github.com/SocketCluster/sc-broker-cluster) - This is a more complex brokerEngine - It allows messages to be brokered between
multiple processes and can be synchronized with remote hosts too so you can get both horizontal and vertical scalability.

The main benefit of this module is that it gives you maximum flexibility. You just need to attach it to a Node.js http server so you can use it alongside pretty much any framework.
