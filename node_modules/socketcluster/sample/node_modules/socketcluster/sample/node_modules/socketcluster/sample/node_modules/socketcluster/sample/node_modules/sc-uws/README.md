`sc-uws` is a replacement module for `ws` which allows significant performance and memory-usage improvements. This module is specifically *only* compatible with Node.js and is installed *only* like so:

`npm install sc-uws`

* sc-uws *can* use node-gyp and *can* recompile itself at installation but does *not* require so.
* npm installation never fails, but `require('sc-uws')` will throw if all of the below points hold true:
  * There was no C++11 compiler available at installation.
  * Your system is not an official **Tier 1** Node.js platform.

## Keep in mind
You can't fix a clogged up system by only fixing part of the problem. Swapping to sc-uws can have *dramatic* effects if your entire pipeline works well.

[Read more about other horrible Node.js projects here](https://github.com/alexhultman/The-Node.js-performance-palette)

## Usage
`sc-uws` tries to mimic `ws` as closely as possible without sacrificing too much performance. In most cases you simply swap `require('ws')` with `require('sc-uws')`:

```javascript
var WebSocketServer = require('sc-uws').Server;
var wss = new WebSocketServer({ port: 3000 });

function onMessage(message) {
    console.log('received: ' + message);
}

wss.on('connection', function(ws) {
    ws.on('message', onMessage);
    ws.send('something');
});
```

##### Deviations from ws
There are some important incompatibilities with `ws` though, we aim to be ~90% compatible but will never implement behavior that is deemed too inefficient:

* Binary data is passed zero-copy as an `ArrayBuffer`. This means you need to copy it to keep it past the callback. It also means you need to convert it with `Buffer.from(message)` if you expect a `Node.js Buffer`.
* `webSocket._socket` is not a `net.Socket`, it is just a getter function with very basic functionalities.
* `webSocket._socket.remote...` might fail, you need to cache it at connection.
* `webSocket` acts like an `EventEmitter` with one listener per event maximum.
* `webSocket.upgradeReq` is only valid during execution of the connection handler. If you want to keep properties of the upgradeReq for the entire lifetime of the webSocket you better attach that specific property to the webSocket at connection.
