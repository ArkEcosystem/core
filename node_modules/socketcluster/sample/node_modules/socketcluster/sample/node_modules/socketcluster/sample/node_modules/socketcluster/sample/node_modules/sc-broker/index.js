var fork = require('child_process').fork;
var EventEmitter = require('events').EventEmitter;
var ComSocket = require('ncom').ComSocket;
var FlexiMap = require('fleximap').FlexiMap;
var uuid = require('uuid');

var scErrors = require('sc-errors');
var BrokerError = scErrors.BrokerError;
var TimeoutError = scErrors.TimeoutError;

var DEFAULT_PORT = 9435;
var HOST = '127.0.0.1';
var DEFAULT_CONNECT_RETRY_ERROR_THRESHOLD = 20;
var DEFAULT_IPC_ACK_TIMEOUT = 10000;

var Server = function (options) {
  EventEmitter.call(this);
  var self = this;

  var defaultBrokerControllerPath = __dirname + '/default-broker-controller.js';

  var serverOptions = {
    id: options.id,
    debug: options.debug,
    socketPath: options.socketPath,
    port: options.port,
    expiryAccuracy: options.expiryAccuracy,
    downgradeToUser: options.downgradeToUser,
    brokerControllerPath: options.brokerControllerPath || defaultBrokerControllerPath,
    processTermTimeout: options.processTermTimeout
  };

  self.options = options;

  self._pendingResponseHandlers = {};

  var stringArgs = JSON.stringify(serverOptions);

  self.socketPath = options.socketPath;
  if (!self.socketPath) {
    self.port = options.port;
  }

  if (options.ipcAckTimeout == null) {
    self.ipcAckTimeout = DEFAULT_IPC_ACK_TIMEOUT;
  } else {
    self.ipcAckTimeout = options.ipcAckTimeout;
  }

  if (!options.brokerOptions) {
    options.brokerOptions = {};
  }
  options.brokerOptions.secretKey = options.secretKey;
  options.brokerOptions.instanceId = options.instanceId;

  var debugRegex = /^--debug(=[0-9]*)?$/;
  var debugBrkRegex = /^--debug-brk(=[0-9]*)?$/;
  var inspectRegex = /^--inspect(=[0-9]*)?$/;
  var inspectBrkRegex = /^--inspect-brk(=[0-9]*)?$/;

  // Brokers should not inherit the master --debug argument
  // because they have their own --debug-brokers option.
  var execOptions = {
    execArgv: process.execArgv.filter(function (arg) {
      return !debugRegex.test(arg) && !debugBrkRegex.test(arg) && !inspectRegex.test(arg) && !inspectBrkRegex.test(arg);
    }),
    env: {}
  };

  Object.keys(process.env).forEach(function (key) {
    execOptions.env[key] = process.env[key];
  });
  execOptions.env.brokerInitOptions = JSON.stringify(options.brokerOptions);

  if (options.debug) {
    execOptions.execArgv.push('--debug=' + options.debug);
  }
  if (options.inspect) {
    execOptions.execArgv.push('--inspect=' + options.inspect);
  }

  self._server = fork(serverOptions.brokerControllerPath, [stringArgs], execOptions);

  var formatError = function (error) {
    var err = scErrors.hydrateError(error, true);
    if (typeof err == 'object') {
      if (err.name == null || err.name == 'Error') {
        err.name = 'BrokerError';
      }
      err.brokerPid = self._server.pid;
    }
    return err;
  };

  self._server.on('error', function (error) {
    var err = formatError(error);
    self.emit('error', err);
  });

  self._server.on('message', function (value) {
    if (value.type == 'error') {
      var err = formatError(value.data);
      self.emit('error', err);
    } else if (value.type == 'brokerMessage') {
      self.emit('brokerMessage', value.brokerId, value.data, function (err, data) {
        if (value.cid) {
          self._server.send({
            type: 'masterResponse',
            error: scErrors.dehydrateError(err, true),
            data: data,
            rid: value.cid
          });
        }
      });
    } else if (value.type == 'brokerResponse') {
      var responseHandler = self._pendingResponseHandlers[value.rid];
      if (responseHandler) {
        clearTimeout(responseHandler.timeout);
        delete self._pendingResponseHandlers[value.rid];
        var properError = scErrors.hydrateError(value.error, true);
        responseHandler.callback(properError, value.data, value.brokerId);
      }
    } else if (value.type == 'listening') {
      self.emit('ready', value.data);
    }
  });

  self._server.on('exit', function (code, signal) {
    self.emit('exit', {
      id: options.id,
      pid: self._server.pid,
      code: code,
      signal: signal
    });
  });

  self.destroy = function () {
    self._server.kill('SIGTERM');
  };

  self._createIPCResponseHandler = function (callback) {
    var cid = uuid.v4();

    var responseTimeout = setTimeout(function () {
      var responseHandler = self._pendingResponseHandlers[cid];
      delete self._pendingResponseHandlers[cid];
      var timeoutError = new TimeoutError('IPC response timed out');
      responseHandler.callback(timeoutError);
    }, self.ipcAckTimeout);

    self._pendingResponseHandlers[cid] = {
      callback: callback,
      timeout: responseTimeout
    };

    return cid;
  };

  self.sendToBroker = function (data, callback) {
    var messagePacket = {
      type: 'masterMessage',
      data: data
    };
    if (callback) {
      messagePacket.cid = self._createIPCResponseHandler(callback);
    }
    self._server.send(messagePacket);
  };
};

Server.prototype = Object.create(EventEmitter.prototype);

module.exports.createServer = function (options) {
  if (!options) {
    options = {};
  }
  if (!options.socketPath && !options.port) {
    options.port = DEFAULT_PORT;
  }
  return new Server(options);
};

var Client = function (options) {
  var self = this;

  var secretKey = options.secretKey || null;
  var timeout = options.timeout;

  self.socketPath = options.socketPath;
  self.port = options.port;
  self.host = options.host;

  if (options.autoReconnect == null) {
    self.autoReconnect = true;
  } else {
    self.autoReconnect = options.autoReconnect;
  }

  if (self.autoReconnect) {
    if (options.autoReconnectOptions == null) {
      options.autoReconnectOptions = {};
    }

    var reconnectOptions = options.autoReconnectOptions;
    if (reconnectOptions.initialDelay == null) {
      reconnectOptions.initialDelay = 200;
    }
    if (reconnectOptions.randomness == null) {
      reconnectOptions.randomness = 100;
    }
    if (reconnectOptions.multiplier == null) {
      reconnectOptions.multiplier = 1.3;
    }
    if (reconnectOptions.maxDelay == null) {
      reconnectOptions.maxDelay = 1000;
    }
    self.autoReconnectOptions = reconnectOptions;
  }

  if (options.connectRetryErrorThreshold == null) {
    self.connectRetryErrorThreshold = DEFAULT_CONNECT_RETRY_ERROR_THRESHOLD;
  } else {
    self.connectRetryErrorThreshold = options.connectRetryErrorThreshold;
  }

  self.CONNECTED = 'connected';
  self.CONNECTING = 'connecting';
  self.DISCONNECTED = 'disconnected';

  self.state = self.DISCONNECTED;

  if (timeout) {
    self._timeout = timeout;
  } else {
    self._timeout = 10000;
  }

  self._subscriptionMap = {};
  self._commandMap = {};
  self._pendingBuffer = [];
  self._pendingSubscriptionBuffer = [];

  self.connectAttempts = 0;
  self.pendingReconnect = false;
  self.pendingReconnectTimeout = null;

  self._socket = new ComSocket();

  self._socket.on('error', function (err) {
    var isConnectionFailure = err.code == 'ENOENT' || err.code == 'ECONNREFUSED';
    var isBelowRetryThreshold = self.connectAttempts < self.connectRetryErrorThreshold;

    // We can tolerate a few missed reconnections without emitting a full error.
    if (isConnectionFailure && isBelowRetryThreshold && err.address == options.socketPath) {
      self.emit('warning', err);
    } else {
      self.emit('error', err);
    }
  });

  if (options.pubSubBatchDuration != null) {
    self._socket.batchDuration = options.pubSubBatchDuration;
  }

  self._curID = 1;
  self.MAX_ID = Math.pow(2, 53) - 2;

  self.setMaxListeners(0);

  self._tryReconnect = function (initialDelay) {
    var exponent = self.connectAttempts++;
    var reconnectOptions = self.autoReconnectOptions;
    var timeout;

    if (initialDelay == null || exponent > 0) {
      var initialTimeout = Math.round(reconnectOptions.initialDelay + (reconnectOptions.randomness || 0) * Math.random());

      timeout = Math.round(initialTimeout * Math.pow(reconnectOptions.multiplier, exponent));
    } else {
      timeout = initialDelay;
    }

    if (timeout > reconnectOptions.maxDelay) {
      timeout = reconnectOptions.maxDelay;
    }

    clearTimeout(self._reconnectTimeoutRef);

    self.pendingReconnect = true;
    self.pendingReconnectTimeout = timeout;
    self._reconnectTimeoutRef = setTimeout(function () {
      self._connect();
    }, timeout);
  };

  self._genID = function () {
    self._curID = (self._curID + 1) % self.MAX_ID;
    return 'n' + self._curID;
  };

  self._flushPendingBuffers = function () {
    var subBufLen = self._pendingSubscriptionBuffer.length;
    for (var i = 0; i < subBufLen; i++) {
      var subCommandData = self._pendingSubscriptionBuffer[i];
      self._execCommand(subCommandData.command, subCommandData.options);
    }
    self._pendingSubscriptionBuffer = [];

    var bufLen = self._pendingBuffer.length;
    for (var j = 0; j < bufLen; j++) {
      var commandData = self._pendingBuffer[j];
      self._execCommand(commandData.command, commandData.options);
    }
    self._pendingBuffer = [];
  };

  self._flushPendingBuffersIfConnected = function () {
    if (self.state == self.CONNECTED) {
      self._flushPendingBuffers();
    }
  };

  self._prepareAndTrackCommand = function (command, callback) {
    command.id = self._genID();
    if (callback) {
      var request = {callback: callback, command: command};
      self._commandMap[command.id] = request;

      request.timeout = setTimeout(function () {
        var error = new TimeoutError('Broker Error - The ' + command.action + ' action timed out');
        delete request.callback;
        if (self._commandMap.hasOwnProperty(command.id)) {
          delete self._commandMap[command.id];
        }
        callback(error);
      }, self._timeout);
    }
  };

  self._bufferSubscribeCommand = function (command, callback, options) {
    self._prepareAndTrackCommand(command, callback);
    // Clone the command argument to prevent the user from modifying the data
    // whilst the command is still pending in the buffer.
    var commandData = {
      command: JSON.parse(JSON.stringify(command)),
      options: options
    };
    self._pendingSubscriptionBuffer.push(commandData);
  };

  self._bufferCommand = function (command, callback, options) {
    self._prepareAndTrackCommand(command, callback);
    // Clone the command argument to prevent the user from modifying the data
    // whilst the command is still pending in the buffer.
    var commandData = {
      command: JSON.parse(JSON.stringify(command)),
      options: options
    };
    self._pendingBuffer.push(commandData);
  };

  // Recovers subscriptions after Broker server crash
  self._resubscribeAll = function () {
    var hasFailed = false;
    var handleResubscribe = function (channel, err) {
      if (err) {
        if (!hasFailed) {
          hasFailed = true;
          self.emit('error', new BrokerError('Failed to resubscribe to Broker server channels'));
        }
      }
    };
    var channels = self._subscriptionMap;
    for (var i in channels) {
      if (channels.hasOwnProperty(i)) {
        self.subscribe(i, handleResubscribe.bind(self, i), true);
      }
    }
  };

  self._connectHandler = function () {
    var command = {
      action: 'init',
      secretKey: secretKey
    };
    var initHandler = function (err, brokerInfo) {
      if (err) {
        self.emit('error', err);
      } else {
        self.state = self.CONNECTED;
        self.connectAttempts = 0;
        self._resubscribeAll();
        self._flushPendingBuffers();
        self.emit('ready', brokerInfo);
      }
    };
    self._prepareAndTrackCommand(command, initHandler);
    self._execCommand(command);
  };

  self._connect = function () {
    if (self.state == self.DISCONNECTED) {
      self.pendingReconnect = false;
      self.pendingReconnectTimeout = null;
      clearTimeout(self._reconnectTimeoutRef);
      self.state = self.CONNECTING;

      if (self.socketPath) {
        self._socket.connect(self.socketPath);
      } else {
        self._socket.connect(self.port, self.host);
      }
      self._socket.removeListener('connect', self._connectHandler);
      self._socket.on('connect', self._connectHandler);
    }
  };

  var handleDisconnection = function () {
    self.state = self.DISCONNECTED;
    self.pendingReconnect = false;
    self.pendingReconnectTimeout = null;
    clearTimeout(self._reconnectTimeoutRef);
    self._pendingBuffer = [];
    self._pendingSubscriptionBuffer = [];
    self._tryReconnect();
  };

  self._socket.on('close', handleDisconnection);
  self._socket.on('end', handleDisconnection);

  self._socket.on('message', function (response) {
    var id = response.id;
    var rawError = response.error;
    var error = null;
    if (rawError != null) {
      error = scErrors.hydrateError(rawError, true);
    }
    if (response.type == 'response') {
      if (self._commandMap.hasOwnProperty(id)) {
        clearTimeout(self._commandMap[id].timeout);
        var action = response.action;

        var callback = self._commandMap[id].callback;
        delete self._commandMap[id];

        if (response.value !== undefined) {
          callback(error, response.value);
        } else {
          callback(error);
        }
      }
    } else if (response.type == 'message') {
      self.emit('message', response.channel, response.value);
    }
  });

  self._connect();

  self._execCommand = function (command, options) {
    self._socket.write(command, options);
  };

  self.isConnected = function() {
    return self.state == self.CONNECTED;
  };

  self.extractKeys = function (object) {
    return Object.keys(object);
  };

  self.extractValues = function (object) {
    var array = [];
    for (var i in object) {
      if (object.hasOwnProperty(i)) {
        array.push(object[i]);
      }
    }
    return array;
  };

  self._getPubSubExecOptions = function () {
    var execOptions = {};
    if (options.pubSubBatchDuration != null) {
      execOptions.batch = true;
    }
    return execOptions;
  };

  self.subscribe = function (channel, ackCallback, force) {
    if (!force && self.isSubscribed(channel)) {
      ackCallback && ackCallback();
    } else {
      self._subscriptionMap[channel] = 'pending';

      var command = {
        channel: channel,
        action: 'subscribe'
      };
      var callback = function (err) {
        if (err) {
          ackCallback && ackCallback(err);
          self.emit('subscribeFail', err, channel);
        } else {
          self._subscriptionMap[channel] = 'subscribed';
          ackCallback && ackCallback();
          self.emit('subscribe', channel);
        }
      };
      var execOptions = self._getPubSubExecOptions();

      self._connect();
      self._bufferSubscribeCommand(command, callback, execOptions);
      self._flushPendingBuffersIfConnected();
    }
  };

  self.unsubscribe = function (channel, ackCallback) {
    // No need to unsubscribe if the server is disconnected
    // The server cleans up automatically in case of disconnection
    if (self.isSubscribed(channel) && self.state == self.CONNECTED) {
      delete self._subscriptionMap[channel];

      var command = {
        action: 'unsubscribe',
        channel: channel
      };

      var cb = function (err) {
        // Unsubscribe can never fail because TCP guarantees
        // delivery for the life of the connection. If the
        // connection fails then all subscriptions
        // will be cleared automatically anyway.
        ackCallback && ackCallback();
        self.emit('unsubscribe');
      };

      var execOptions = self._getPubSubExecOptions();
      self._bufferCommand(command, cb, execOptions);
      self._flushPendingBuffers();
    } else {
      delete self._subscriptionMap[channel];
      ackCallback && ackCallback();
    }
  };

  self.subscriptions = function (includePending) {
    var allSubs = Object.keys(self._subscriptionMap || {});
    if (includePending) {
      return allSubs;
    }
    var activeSubs = [];
    var len = allSubs.length;
    for (var i = 0; i < len; i++) {
      var sub = allSubs[i];
      if (self._subscriptionMap[sub] == 'subscribed') {
        activeSubs.push(sub);
      }
    }
    return activeSubs;
  };

  self.isSubscribed = function (channel, includePending) {
    if (includePending) {
      return !!self._subscriptionMap[channel];
    }
    return self._subscriptionMap[channel] == 'subscribed';
  };

  self.publish = function (channel, value, callback) {
    var command = {
      action: 'publish',
      channel: channel,
      value: value
    };

    var execOptions = self._getPubSubExecOptions();
    self._connect();
    self._bufferCommand(command, callback, execOptions);
    self._flushPendingBuffersIfConnected();
  };

  self.send = function (data, callback) {
    var command = {
      action: 'send',
      value: data
    };

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    set(key, value,[ options, callback])
  */
  self.set = function () {
    var key = arguments[0];
    var value = arguments[1];
    var options = {
      getValue: 0
    };
    var callback;

    if (arguments[2] instanceof Function) {
      callback = arguments[2];
    } else {
      options.getValue = arguments[2];
      callback = arguments[3];
    }

    var command = {
      action: 'set',
      key: key,
      value: value
    };

    if (options.getValue) {
      command.getValue = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    expire(keys, seconds,[ callback])
  */
  self.expire = function (keys, seconds, callback) {
    var command = {
      action: 'expire',
      keys: keys,
      value: seconds
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    unexpire(keys,[ callback])
  */
  self.unexpire = function (keys, callback) {
    var command = {
      action: 'unexpire',
      keys: keys
    };
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    getExpiry(key,[ callback])
  */
  self.getExpiry = function (key, callback) {
    var command = {
      action: 'getExpiry',
      key: key
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    add(key, value,[ options, callback])
  */
  self.add = function () {
    var key = arguments[0];
    var value = arguments[1];
    var callback;
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
    } else {
      callback = arguments[3];
    }

    var command = {
      action: 'add',
      key: key,
      value: value
    };

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    concat(key, value,[ options, callback])
  */
  self.concat = function () {
    var key = arguments[0];
    var value = arguments[1];
    var options = {
      getValue: 0
    };
    var callback;
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
    } else {
      options.getValue = arguments[2];
      callback = arguments[3];
    }

    var command = {
      action: 'concat',
      key: key,
      value: value
    };

    if (options.getValue) {
      command.getValue = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.get = function (key, callback) {
    var command = {
      action: 'get',
      key: key
    };

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    getRange(key, fromIndex,[ toIndex,] callback)
  */
  self.getRange = function () {
    var key = arguments[0];
    var fromIndex = arguments[1];
    var toIndex = null;
    var callback;
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
    } else {
      toIndex = arguments[2];
      callback = arguments[3];
    }

    var command = {
      action: 'getRange',
      key: key,
      fromIndex: fromIndex
    };

    if (toIndex) {
      command.toIndex = toIndex;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.getAll = function (callback) {
    var command = {
      action: 'getAll'
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.count = function (key, callback) {
    var command = {
      action: 'count',
      key: key
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self._stringifyQuery = function (query, data) {
    query = query.toString();

    var validVarNameRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    var headerString = '';

    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        if (!validVarNameRegex.test(i)) {
          throw new BrokerError("The variable name '" + i + "' is invalid");
        }
        headerString += 'var ' + i + '=' + JSON.stringify(data[i]) + ';';
      }
    }

    query = query.replace(/^(function *[(][^)]*[)] *{)/, function (match) {
      return match + headerString;
    });

    return query;
  };

  /*
    registerDeathQuery(query,[ data, callback])
  */
  self.registerDeathQuery = function () {
    var data;
    var callback = null;

    if (arguments[1] instanceof Function) {
      data = arguments[0].data || {};
      callback = arguments[1];
    } else if (arguments[1]) {
      data = arguments[1];
      callback = arguments[2];
    } else {
      data = arguments[0].data || {};
    }

    var query = self._stringifyQuery(arguments[0], data);

    if (query) {
      var command = {
        action: 'registerDeathQuery',
        value: query
      };
      self._connect();
      self._bufferCommand(command, callback);
      self._flushPendingBuffersIfConnected();
    } else {
      callback && callback('Invalid query format - Query must be a string or a function');
    }
  };

  /*
    exec(query,[ options, callback])
  */
  self.exec = function () {
    var data;
    var baseKey = null;
    var noAck = null;
    var callback = null;

    if (arguments[0].data) {
      data = arguments[0].data;
    } else {
      data = {};
    }

    if (arguments[1] instanceof Function) {
      callback = arguments[1];
    } else if (arguments[1]) {
      baseKey = arguments[1].baseKey;
      noAck = arguments[1].noAck;
      if (arguments[1].data) {
        data = arguments[1].data;
      }
      callback = arguments[2];
    }

    var query = self._stringifyQuery(arguments[0], data);

    if (query) {
      var command = {
        action: 'exec',
        value: query
      };

      if (baseKey) {
        command.baseKey = baseKey;
      }
      if (noAck) {
        command.noAck = noAck;
      }

      self._connect();
      self._bufferCommand(command, callback);
      self._flushPendingBuffersIfConnected();
    } else {
      callback && callback('Invalid query format - Query must be a string or a function');
    }
  };

  /*
    query(query,[ data, callback])
  */
  self.query = function () {
    if (arguments[1] && !(arguments[1] instanceof Function)) {
      var options = {data: arguments[1]};
      self.exec(arguments[0], options, arguments[2]);
    } else {
      self.exec.apply(self, arguments);
    }
  };

  /*
    remove(key,[ options, callback])
  */
  self.remove = function () {
    var key = arguments[0];
    var options = {
      getValue: 0
    };
    var callback;
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
    } else {
      if (arguments[1] instanceof Object) {
        options = arguments[1];
      } else {
        options.getValue = arguments[1];
      }
      callback = arguments[2];
    }

    var command = {
      action: 'remove',
      key: key
    };

    if (options.getValue) {
      command.getValue = 1;
    }
    if (options.noAck) {
      command.noAck = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    removeRange(key, fromIndex,[ options, callback])
  */
  self.removeRange = function () {
    var key = arguments[0];
    var fromIndex = arguments[1];
    var options = {
      toIndex: null,
      getValue: 0
    };
    var callback;
    if (arguments[2] instanceof Function) {
      callback = arguments[2];
    } else if (arguments[3] instanceof Function) {
      if (arguments[2] instanceof Object) {
        options = arguments[2];
      } else {
        options.toIndex = arguments[2];
      }
      callback = arguments[3];
    } else {
      options.toIndex = arguments[2];
      options.getValue = arguments[3];
      callback = arguments[4];
    }

    var command = {
      action: 'removeRange',
      fromIndex: fromIndex,
      key: key
    };

    if (options.toIndex) {
      command.toIndex = options.toIndex;
    }
    if (options.getValue) {
      command.getValue = 1;
    }
    if (options.noAck) {
      command.noAck = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.removeAll = function (callback) {
    var command = {
      action: 'removeAll'
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    splice(key,[ options, callback])
    The following options are supported:
    - fromIndex
    - count // Number of items to delete
    - items // Must be an Array of items to insert as part of splice
  */
  self.splice = function () {
    var key = arguments[0];
    var index = arguments[1];
    var options = {};
    var callback;

    if (arguments[2] instanceof Function) {
      options = arguments[1];
      callback = arguments[2];
    } else if (arguments[1] instanceof Function) {
      callback = arguments[1];
    } else if (arguments[1]) {
      options = arguments[1];
    }

    var command = {
      action: 'splice',
      key: key
    };

    if (options.index != null) {
      command.index = options.index;
    }
    if (options.count != null) {
      command.count = options.count;
    }
    if (options.items != null) {
      command.items = options.items;
    }
    if (options.getValue) {
      command.getValue = 1;
    }
    if (options.noAck) {
      command.noAck = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  /*
    pop(key,[ options, callback])
  */
  self.pop = function () {
    var key = arguments[0];
    var options = {
      getValue: 0
    };
    var callback;
    if (arguments[1] instanceof Function) {
      callback = arguments[1];
    } else {
      options.getValue = arguments[1];
      callback = arguments[2];
    }

    var command = {
      action: 'pop',
      key: key
    };
    if (options.getValue) {
      command.getValue = 1;
    }
    if (options.noAck) {
      command.noAck = 1;
    }

    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.hasKey = function (key, callback) {
    var command = {
      action: 'hasKey',
      key: key
    };
    self._connect();
    self._bufferCommand(command, callback);
    self._flushPendingBuffersIfConnected();
  };

  self.end = function (callback) {
    clearTimeout(self._reconnectTimeoutRef);
    self.unsubscribe(null, function () {
      if (callback) {
        var disconnectCallback = function () {
          if (disconnectTimeout) {
            clearTimeout(disconnectTimeout);
          }
          setTimeout(callback, 0);
          self._socket.removeListener('end', disconnectCallback);
        };

        var disconnectTimeout = setTimeout(function () {
          self._socket.removeListener('end', disconnectCallback);
          callback('Disconnection timed out');
        }, self._timeout);

        if (self._socket.connected) {
          self._socket.on('end', disconnectCallback);
        } else {
          disconnectCallback();
        }
      }
      var setDisconnectStatus = function () {
        self._socket.removeListener('end', setDisconnectStatus);
        self.state = self.DISCONNECTED;
      };
      if (self._socket.connected) {
        self._socket.on('end', setDisconnectStatus);
        self._socket.end();
      } else {
        self._socket.destroy();
        self.state = self.DISCONNECTED;
      }
    });
  };
};

Client.prototype = Object.create(EventEmitter.prototype);

module.exports.createClient = function (options) {
  if (!options) {
    options = {};
  }
  if (!options.socketPath && !options.port) {
    options.port = DEFAULT_PORT;
  }
  if (!options.socketPath && !options.host) {
    options.host = HOST;
  }
  return new Client(options);
};
