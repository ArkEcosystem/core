var args = JSON.parse(process.argv[2]);

var PORT;
if (args.port) {
  PORT = parseInt(args.port);
}
var BROKER_ID = args.id || 0;
var SOCKET_PATH = args.socketPath;
var EXPIRY_ACCURACY = args.expiryAccuracy || 1000;
var BROKER_CONTROLLER_PATH = args.brokerControllerPath;
var DOWNGRADE_TO_USER = args.downgradeToUser;
var PROCESS_TERM_TIMEOUT = args.processTermTimeout || 10000;
var DEBUG_PORT = args.debug || null;
var INIT_CONTROLLER = null;
var BROKER_CONTROLLER = null;
var DEFAULT_IPC_ACK_TIMEOUT = 10000;

var brokerInitOptions = JSON.parse(process.env.brokerInitOptions);

var EventEmitter = require('events').EventEmitter;

var async = require('async');
var fs = require('fs');
var uuid = require('uuid');
var com = require('ncom');
var ExpiryManager = require('expirymanager').ExpiryManager;
var FlexiMap = require('fleximap').FlexiMap;

var scErrors = require('sc-errors');
var BrokerError = scErrors.BrokerError;
var TimeoutError = scErrors.TimeoutError;
var InvalidArgumentsError = scErrors.InvalidArgumentsError;
var InvalidActionError = scErrors.InvalidActionError;

var initialized = {};

// Non-fatal error.
var sendErrorToMaster = function (err) {
  var error = scErrors.dehydrateError(err, true);
  process.send({type: 'error', data: error});
};

// Fatal error.
var exitWithError = function (err) {
  sendErrorToMaster(err);
  process.exit(1);
};

if (DOWNGRADE_TO_USER && process.setuid) {
  try {
    process.setuid(DOWNGRADE_TO_USER);
  } catch (err) {
    sendErrorToMaster(new BrokerError('Could not downgrade to user "' + DOWNGRADE_TO_USER +
      '" - Either this user does not exist or the current process does not have the permission' +
      ' to switch to it'));
  }
}

var send = function (socket, object, options) {
  socket.write(object, options);
};

var dataMap = new FlexiMap();
var subscriptions = {};

var dataExpirer = new ExpiryManager();

var addListener = function (socket, channel) {
  if (subscriptions[socket.id] == null) {
    subscriptions[socket.id] = {};
  }
  subscriptions[socket.id][channel] = socket;
};

var hasListener = function (socket, channel) {
  return !!(subscriptions[socket.id] && subscriptions[socket.id][channel]);
};

var anyHasListener = function (channel) {
  for (var i in subscriptions) {
    if (subscriptions.hasOwnProperty(i)) {
      if (subscriptions[i][channel]) {
        return true;
      }
    }
  }
  return false;
};

var removeListener = function (socket, channel) {
  if (subscriptions[socket.id]) {
    delete subscriptions[socket.id][channel];
  }
};

var removeAllListeners = function (socket) {
  var subMap = subscriptions[socket.id];
  var channels = [];
  for (var i in subMap) {
    if (subMap.hasOwnProperty(i)) {
      channels.push(i);
    }
  }
  delete subscriptions[socket.id];
  return channels;
};

var exec = function (query, baseKey) {
  var rebasedDataMap;
  if (baseKey) {
    rebasedDataMap = dataMap.getRaw(baseKey);
  } else {
    rebasedDataMap = dataMap;
  }

  return Function('"use strict"; return (' + query + ')(arguments[0], arguments[1], arguments[2]);')(rebasedDataMap, dataExpirer, subscriptions);
};

var pendingResponseHandlers = {};

function createIPCResponseHandler(ipcAckTimeout, callback) {
  var cid = uuid.v4();

  var responseTimeout = setTimeout(function () {
    var responseHandler = pendingResponseHandlers[cid];
    delete pendingResponseHandlers[cid];
    var timeoutError = new TimeoutError('IPC response timed out');
    responseHandler.callback(timeoutError);
  }, ipcAckTimeout);

  pendingResponseHandlers[cid] = {
    callback: callback,
    timeout: responseTimeout
  };

  return cid;
}

function handleMasterResponse(message) {
  var responseHandler = pendingResponseHandlers[message.rid];
  if (responseHandler) {
    clearTimeout(responseHandler.timeout);
    delete pendingResponseHandlers[message.rid];
    var properError = scErrors.hydrateError(message.error, true);
    responseHandler.callback(properError, message.data);
  }
}

var scBroker;

function SCBroker(options) {
  if (scBroker) {
    var err = new BrokerError('Attempted to instantiate a broker which has already been instantiated');
    throw err;
  }

  EventEmitter.call(this);
  options = options || {};
  scBroker = this;

  this.id = BROKER_ID;
  this.debugPort = DEBUG_PORT;
  this.type = 'broker';
  this.dataMap = dataMap;
  this.dataExpirer = dataExpirer;
  this.subscriptions = subscriptions;

  this.MIDDLEWARE_SUBSCRIBE = 'subscribe';
  this.MIDDLEWARE_PUBLISH_IN = 'publishIn';
  this._middleware = {};
  this._middleware[this.MIDDLEWARE_SUBSCRIBE] = [];
  this._middleware[this.MIDDLEWARE_PUBLISH_IN] = [];

  if (options.run != null) {
    this.run = options.run;
  }

  this._init(brokerInitOptions);
}

SCBroker.create = function (options) {
  return new SCBroker(options);
};

SCBroker.prototype = Object.create(EventEmitter.prototype);

SCBroker.prototype._init = function (options) {
  this.options = options;
  this.instanceId = this.options.instanceId;
  this.secretKey = this.options.secretKey;
  this.ipcAckTimeout = this.options.ipcAckTimeout || DEFAULT_IPC_ACK_TIMEOUT;

  var runResult = this.run();
  Promise.resolve(runResult)
  .then(comServerListen)
  .catch(exitWithError);
};

SCBroker.prototype.run = function () {};

SCBroker.prototype.sendToMaster = function (data, callback) {
  var messagePacket = {
    type: 'brokerMessage',
    brokerId: this.id,
    data: data
  };
  if (callback) {
    messagePacket.cid = createIPCResponseHandler(this.ipcAckTimeout, callback);
  }
  process.send(messagePacket);
};

SCBroker.prototype.exec = function (query, baseKey) {
  return exec(query, baseKey);
};

SCBroker.prototype.publish = function (channel, message) {
  var sock;
  for (var i in subscriptions) {
    if (subscriptions.hasOwnProperty(i)) {
      sock = subscriptions[i][channel];
      if (sock && sock instanceof com.ComSocket) {
        send(sock, {type: 'message', channel: channel, value: message}, pubSubOptions);
      }
    }
  }
};

SCBroker.prototype._passThroughMiddleware = function (command, socket, cb) {
  var self = this;
  var action = command.action;
  var callbackInvoked = false;

  var applyEachMiddleware = function (type, req, cb) {
    async.applyEachSeries(self._middleware[type], req, function (err) {
      if (callbackInvoked) {
        self.emit('warning', new InvalidActionError(`Callback for ${type} middleware was already invoked`));
      } else {
        callbackInvoked = true;
        cb(err, req);
      }
    });
  }

  if (action === 'subscribe') {
    var req = { socket: socket, channel: command.channel };
    applyEachMiddleware(this.MIDDLEWARE_SUBSCRIBE, req, cb);
  } else if (action === 'publish') {
    var req = { socket: socket, channel: command.channel, command: command };
    applyEachMiddleware(this.MIDDLEWARE_PUBLISH_IN, req, cb);
  } else {
    cb(null);
  }
}

SCBroker.prototype.addMiddleware = function (type, middleware) {
  if (!this._middleware[type]) {
    throw new InvalidArgumentsError(`Middleware type "${type}" is not supported`);
  }

  this._middleware[type].push(middleware);
}

SCBroker.prototype.removeMiddleware = function (type, middleware) {
  var middlewareFunctions = this._middleware[type];
  if (!middlewareFunctions) {
    throw new InvalidArgumentsError(`Middleware type "${type}" is not supported`);
  }

  this._middleware[type] = middlewareFunctions.filter(function (fn) {
    return fn !== middleware;
  });
};

var pubSubOptions = {
  batch: true
};

var actions = {
  init: function (command, socket) {
    var brokerInfo = {
      id: BROKER_ID,
      pid: process.pid
    };
    var result = {id: command.id, type: 'response', action: 'init', value: brokerInfo};
    if (scBroker.secretKey == null || command.secretKey === scBroker.secretKey) {
      initialized[socket.id] = {};
    } else {
      var err = new BrokerError('Invalid password was supplied to the broker');
      result.error = scErrors.dehydrateError(err, true);
    }
    send(socket, result);
  },

  set: function (command, socket) {
    var result = scBroker.dataMap.set(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'set'};
    if (command.getValue) {
      response.value = result;
    }
    send(socket, response);
  },

  expire: function (command, socket) {
    scBroker.dataExpirer.expire(command.keys, command.value);
    var response = {id: command.id, type: 'response', action: 'expire'};
    send(socket, response);
  },

  unexpire: function (command, socket) {
    scBroker.dataExpirer.unexpire(command.keys);
    var response = {id: command.id, type: 'response', action: 'unexpire'};
    send(socket, response);
  },

  getExpiry: function (command, socket) {
    var response = {id: command.id, type: 'response', action: 'getExpiry', value: scBroker.dataExpirer.getExpiry(command.key)};
    send(socket, response);
  },

  get: function (command, socket) {
    var result = scBroker.dataMap.get(command.key);
    send(socket, {id: command.id, type: 'response', action: 'get', value: result});
  },

  getRange: function (command, socket) {
    var result = scBroker.dataMap.getRange(command.key, command.fromIndex, command.toIndex);
    send(socket, {id: command.id, type: 'response', action: 'getRange', value: result});
  },

  getAll: function (command, socket) {
    send(socket, {id: command.id, type: 'response', action: 'getAll', value: scBroker.dataMap.getAll()});
  },

  count: function (command, socket) {
    var result = scBroker.dataMap.count(command.key);
    send(socket, {id: command.id, type: 'response', action: 'count', value: result});
  },

  add: function (command, socket) {
    var result = scBroker.dataMap.add(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'add', value: result};
    send(socket, response);
  },

  concat: function (command, socket) {
    var result = scBroker.dataMap.concat(command.key, command.value);
    var response = {id: command.id, type: 'response', action: 'concat'};
    if (command.getValue) {
      response.value = result;
    }
    send(socket, response);
  },

  registerDeathQuery: function (command, socket) {
    var response = {id: command.id, type: 'response', action: 'registerDeathQuery'};

    if (initialized[socket.id]) {
      initialized[socket.id].deathQuery = command.value;
    }
    send(socket, response);
  },

  exec: function (command, socket) {
    var ret = {id: command.id, type: 'response', action: 'exec'};
    try {
      var result = scBroker.exec(command.value, command.baseKey);
      if (result !== undefined) {
        ret.value = result;
      }
    } catch (e) {
      var queryErrorPrefix = 'Exception at exec(): ';
      if (typeof e === 'string') {
        e = queryErrorPrefix + e;
      } else if (typeof e.message === 'string') {
        e.message = queryErrorPrefix + e.message;
      }
      ret.error = scErrors.dehydrateError(e, true);
    }
    if (!command.noAck) {
      send(socket, ret);
    }
  },

  remove: function (command, socket) {
    var result = scBroker.dataMap.remove(command.key);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'remove'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  removeRange: function (command, socket) {
    var result = scBroker.dataMap.removeRange(command.key, command.fromIndex, command.toIndex);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'removeRange'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  removeAll: function (command, socket) {
    scBroker.dataMap.removeAll();
    if (!command.noAck) {
      send(socket, {id: command.id, type: 'response', action: 'removeAll'});
    }
  },

  splice: function (command, socket) {
    var args = [command.key, command.index, command.count];
    if (command.items) {
      args = args.concat(command.items);
    }
    // Remove any consecutive undefined references from end of array
    for (var i = args.length - 1; i >= 0; i--) {
      if (args[i] !== undefined) {
        break;
      }
      args.pop();
    }
    var result = scBroker.dataMap.splice.apply(scBroker.dataMap, args);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'splice'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  pop: function (command, socket) {
    var result = scBroker.dataMap.pop(command.key);
    if (!command.noAck) {
      var response = {id: command.id, type: 'response', action: 'pop'};
      if (command.getValue) {
        response.value = result;
      }
      send(socket, response);
    }
  },

  hasKey: function (command, socket) {
    send(socket, {id: command.id, type: 'response', action: 'hasKey', value: scBroker.dataMap.hasKey(command.key)});
  },

  subscribe: function (command, socket) {
    var hasListener = anyHasListener(command.channel);
    addListener(socket, command.channel);
    if (!hasListener) {
      scBroker.emit('subscribe', command.channel);
    }
    send(socket, {id: command.id, type: 'response', action: 'subscribe', channel: command.channel}, pubSubOptions);
  },

  unsubscribe: function (command, socket) {
    if (command.channel) {
      removeListener(socket, command.channel);
      var hasListener = anyHasListener(command.channel);
      if (!hasListener) {
        scBroker.emit('unsubscribe', command.channel);
      }
    } else {
      var channels = removeAllListeners(socket);
      for (var i in channels) {
        if (channels.hasOwnProperty(i)) {
          if (!anyHasListener(channels[i])) {
            scBroker.emit('unsubscribe', channels[i]);
          }
        }
      }
    }
    send(socket, {id: command.id, type: 'response', action: 'unsubscribe', channel: command.channel}, pubSubOptions);
  },

  isSubscribed: function (command, socket) {
    var result = hasListener(socket, command.channel);
    send(socket, {id: command.id, type: 'response', action: 'isSubscribed', channel: command.channel, value: result}, pubSubOptions);
  },

  publish: function (command, socket) {
    scBroker.publish(command.channel, command.value);
    var response = {id: command.id, type: 'response', action: 'publish', channel: command.channel};
    if (command.getValue) {
      response.value = command.value;
    }
    scBroker.emit('publish', command.channel, command.value);
    send(socket, response, pubSubOptions);
  },

  send: function (command, socket) {
    scBroker.emit('message', command.value, function (err, data) {
      var response = {
        id: command.id,
        type: 'response',
        action: 'send',
        value: data
      };
      if (err) {
        response.error = scErrors.dehydrateError(err, true);
      }
      send(socket, response);
    });
  }
};

var MAX_ID = Math.pow(2, 53) - 2;
var curID = 1;

var genID = function () {
  curID++;
  curID = curID % MAX_ID;
  return curID;
};

var comServer = com.createServer();
var connections = {};

var handleConnection = function (sock) {
  sock.on('error', sendErrorToMaster);
  sock.id = genID();

  connections[sock.id] = sock;

  sock.on('message', function (command) {
    if (initialized.hasOwnProperty(sock.id) || command.action === 'init') {
      scBroker._passThroughMiddleware(command, sock, function (err) {
        try {
          if (err) {
            throw err;
          } else if (actions[command.action]) {
            actions[command.action](command, sock);
          }
        } catch (err) {
          err = scErrors.dehydrateError(err, true);
          send(sock, {id: command.id, type: 'response', action:  command.action, error: err});
        }
      });
    } else {
      var err = new BrokerError('Cannot process command before init handshake');
      err = scErrors.dehydrateError(err, true);
      send(sock, {id: command.id, type: 'response', action: command.action, error: err});
    }
  });

  sock.on('close', function () {
    delete connections[sock.id];

    if (initialized[sock.id]) {
      if (initialized[sock.id].deathQuery) {
        exec(initialized[sock.id].deathQuery);
      }
      delete initialized[sock.id];
    }
    var channels = removeAllListeners(sock);
    for (var i in channels) {
      if (channels.hasOwnProperty(i)) {
        if (!anyHasListener(channels[i])) {
          scBroker.emit('unsubscribe', channels[i]);
        }
      }
    }
  });
};

comServer.on('connection', handleConnection);

comServer.on('listening', function () {
  var brokerInfo = {
    id: BROKER_ID,
    pid: process.pid
  };
  process.send({
    type: 'listening',
    data: brokerInfo
  });
});

var comServerListen = function () {
  if (SOCKET_PATH) {
    if (process.platform !== 'win32' && fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH)
    }
    comServer.listen(SOCKET_PATH);
  } else {
    comServer.listen(PORT);
  }
};

process.on('message', function (m) {
  if (m) {
    if (m.type === 'masterMessage') {
      if (scBroker) {
        scBroker.emit('masterMessage', m.data, function (err, data) {
          if (m.cid) {
            process.send({
              type: 'brokerResponse',
              brokerId: scBroker.id,
              error: scErrors.dehydrateError(err, true),
              data: data,
              rid: m.cid
            });
          }
        });
      } else {
        var errorMessage = 'Cannot send message to broker with id ' + BROKER_ID +
        ' because the broker was not instantiated';
        var err = new BrokerError(errorMessage);
        sendErrorToMaster(err);
      }
    } else if (m.type === 'masterResponse') {
      handleMasterResponse(m);
    }
  }
});

var killServer = function () {
  comServer.close(function () {
    process.exit();
  });

  for (var i in connections) {
    if (connections.hasOwnProperty(i)) {
      connections[i].destroy();
    }
  }

  setTimeout(function () {
    process.exit();
  }, PROCESS_TERM_TIMEOUT);
};

process.on('SIGTERM', killServer);
process.on('disconnect', killServer);

setInterval(function () {
  var keys = dataExpirer.extractExpiredKeys();
  var len = keys.length;
  for (var i = 0; i < len; i++) {
    dataMap.remove(keys[i]);
  }
}, EXPIRY_ACCURACY);

process.on('uncaughtException', exitWithError);

module.exports = SCBroker;
