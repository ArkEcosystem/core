<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# oppsy

An EventEmitter useful for collecting hapi server ops information.

[![Build Status](https://secure.travis-ci.org/hapijs/oppsy.svg?branch=master)](http://travis-ci.org/hapijs/oppsy)

## Usage

```js
const Hapi = require('@hapi/hapi');
const Oppsy = require('@hapi/oppsy');

const server = new Hapi.Server();
const oppsy = new Oppsy(server);
oppsy.on('ops', (data) => {
  console.log(data);
});

await server.start();

oppsy.start(1000);
```

This creates a new Oppsy object and starts collecting information every 1000 miliseconds

### new Oppsy(server, [config])

Creates a new Oppsy object.
- `server` - the hapi server to collect information about.
- `[config]` - optional configuration object
  - `httpAgents` - the list of httpAgents to report socket information about. Can be a single http.Agent or an array of agents objects. Defaults to Http.globalAgent.
  - `httpsAgents` - the list of httpsAgents to report socket information about. Can be a single https.Agent or an array of agents. Defaults to Https.globalAgent.

The oppsy object is an EventEmitter so it exposes the same API(`.on` and `.emit`) as the Node EventEmitter object. After it is started, it emits an "ops" event after a set interval with the collected ops information as the event payload.

#### oppsy.start(interval)

Starts an Oppsy object collecting network and server information.
- `interval` - number of milliseconds to wait between each data sampling.

#### oppsy.stop()

Stops an Oppsy objects collecting.
