var EventEmitter = require('events').EventEmitter;
var scBroker = require('sc-broker');
var async = require('async');
var ClientCluster = require('./clientcluster').ClientCluster;
var SCChannel = require('sc-channel').SCChannel;
var hash = require('sc-hasher').hash;

var scErrors = require('sc-errors');
var BrokerError = scErrors.BrokerError;
var ProcessExitError = scErrors.ProcessExitError;


var AbstractDataClient = function (dataClient) {
  this._dataClient = dataClient;
};

AbstractDataClient.prototype = Object.create(EventEmitter.prototype);

AbstractDataClient.prototype.set = function () {
  this._dataClient.set.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.expire = function () {
  this._dataClient.expire.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.unexpire = function () {
  this._dataClient.unexpire.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.add = function () {
  this._dataClient.add.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.get = function () {
  this._dataClient.get.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.getRange = function () {
  this._dataClient.getRange.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.getAll = function () {
  this._dataClient.getAll.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.count = function () {
  this._dataClient.count.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.remove = function () {
  this._dataClient.remove.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.removeRange = function () {
  this._dataClient.removeRange.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.removeAll = function () {
  this._dataClient.removeAll.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.splice = function () {
  this._dataClient.splice.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.pop = function () {
  this._dataClient.pop.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.hasKey = function () {
  this._dataClient.hasKey.apply(this._dataClient, arguments);
};

AbstractDataClient.prototype.extractKeys = function (object) {
  return this._dataClient.extractKeys(object);
};

AbstractDataClient.prototype.extractValues = function (object) {
  return this._dataClient.extractValues(object);
};

/*
  exec(queryFn,[ data, callback])
*/
AbstractDataClient.prototype.exec = function () {
  var options = {};

  var callback;

  if (arguments[1] instanceof Function) {
    callback = arguments[1];
  } else {
    options.data = arguments[1];
    callback = arguments[2];
  }
  if (arguments[1] && !(arguments[1] instanceof Function)) {
    options.data = arguments[1];
  }
  this._dataClient.exec(arguments[0], options, callback);
};


var SCExchange = function (privateClientCluster, publicClientCluster, ioClusterClient) {
  AbstractDataClient.call(this, publicClientCluster);

  this._privateClientCluster = privateClientCluster;
  this._publicClientCluster = publicClientCluster;
  this._ioClusterClient = ioClusterClient;
  this._channelEmitter = new EventEmitter();
  this._channels = {};

  this._messageHander = this._handleChannelMessage.bind(this);

  this._ioClusterClient.on('message', this._messageHander);
};

SCExchange.prototype = Object.create(AbstractDataClient.prototype);

SCExchange.prototype.destroy = function () {
  this._ioClusterClient.removeListener('message', this._messageHander);
};

SCExchange.prototype._handleChannelMessage = function (message) {
  var channelName = message.channel;
  if (this.isSubscribed(channelName)) {
    this._channelEmitter.emit(channelName, message.data);
  }
};

SCExchange.prototype._triggerChannelSubscribe = function (channel) {
  var channelName = channel.name;

  channel.state = channel.SUBSCRIBED;

  channel.emit('subscribe', channelName);
  EventEmitter.prototype.emit.call(this, 'subscribe', channelName);
};

SCExchange.prototype._triggerChannelSubscribeFail = function (err, channel) {
  var channelName = channel.name;

  channel.state = channel.UNSUBSCRIBED;

  channel.emit('subscribeFail', err, channelName);
  EventEmitter.prototype.emit.call(this, 'subscribeFail', err, channelName);
};

SCExchange.prototype._triggerChannelUnsubscribe = function (channel, newState) {
  var channelName = channel.name;
  var oldState = channel.state;

  if (newState) {
    channel.state = newState;
  } else {
    channel.state = channel.UNSUBSCRIBED;
  }
  if (oldState === channel.SUBSCRIBED) {
    channel.emit('unsubscribe', channelName);
    EventEmitter.prototype.emit.call(this, 'unsubscribe', channelName);
  }
};

SCExchange.prototype.send = function (data, mapIndex, callback) {
  if (mapIndex == null) {
    // Send to all brokers in cluster if mapIndex is not provided
    mapIndex = '*';
  }
  var targetClients = this._privateClientCluster.map({mapIndex: mapIndex}, 'send');
  var len = targetClients.length;
  var tasks = [];

  for (var i = 0; i < len; i++) {
    (function (client) {
      tasks.push(function (cb) {
        client.send(data, cb);
      });
    })(targetClients[i]);
  }
  async.parallel(tasks, callback);
};

SCExchange.prototype.publish = function (channelName, data, callback) {
  this._ioClusterClient.publish(channelName, data, callback);
};

SCExchange.prototype.subscribe = function (channelName) {
  var self = this;

  var channel = this._channels[channelName];

  if (!channel) {
    channel = new SCChannel(channelName, this);
    this._channels[channelName] = channel;
  }

  if (channel.state === channel.UNSUBSCRIBED) {
    channel.state = channel.PENDING;
    this._ioClusterClient.subscribe(channelName, function (err) {
      if (err) {
        self._triggerChannelSubscribeFail(err, channel);
      } else {
        self._triggerChannelSubscribe(channel);
      }
    });
  }
  return channel;
};

SCExchange.prototype.unsubscribe = function (channelName) {
  var channel = this._channels[channelName];

  if (channel) {
    if (channel.state !== channel.UNSUBSCRIBED) {

      this._triggerChannelUnsubscribe(channel);

      // The only case in which unsubscribe can fail is if the connection is closed or dies.
      // If that's the case, the server will automatically unsubscribe the client so
      // we don't need to check for failure since this operation can never really fail.

      this._ioClusterClient.unsubscribe(channelName);
    }
  }
};

SCExchange.prototype.channel = function (channelName) {
  var currentChannel = this._channels[channelName];

  if (!currentChannel) {
    currentChannel = new SCChannel(channelName, this);
    this._channels[channelName] = currentChannel;
  }
  return currentChannel;
};

SCExchange.prototype.destroyChannel = function (channelName) {
  var channel = this._channels[channelName];
  channel.unwatch();
  channel.unsubscribe();
  delete this._channels[channelName];
};

SCExchange.prototype.subscriptions = function (includePending) {
  var subs = [];
  var channel, includeChannel;
  for (var channelName in this._channels) {
    if (this._channels.hasOwnProperty(channelName)) {
      channel = this._channels[channelName];

      if (includePending) {
        includeChannel = channel && (channel.state === channel.SUBSCRIBED ||
          channel.state === channel.PENDING);
      } else {
        includeChannel = channel && channel.state === channel.SUBSCRIBED;
      }

      if (includeChannel) {
        subs.push(channelName);
      }
    }
  }
  return subs;
};

SCExchange.prototype.isSubscribed = function (channelName, includePending) {
  var channel = this._channels[channelName];
  if (includePending) {
    return !!channel && (channel.state === channel.SUBSCRIBED ||
      channel.state === channel.PENDING);
  }
  return !!channel && channel.state === channel.SUBSCRIBED;
};

SCExchange.prototype.watch = function (channelName, handler) {
  this._channelEmitter.on(channelName, handler);
};

SCExchange.prototype.unwatch = function (channelName, handler) {
  if (handler) {
    this._channelEmitter.removeListener(channelName, handler);
  } else {
    this._channelEmitter.removeAllListeners(channelName);
  }
};

SCExchange.prototype.watchers = function (channelName) {
  return this._channelEmitter.listeners(channelName);
};

SCExchange.prototype.setMapper = function (mapper) {
  this._publicClientCluster.setMapper(mapper);
};

SCExchange.prototype.getMapper = function () {
  return this._publicClientCluster.getMapper();
};

SCExchange.prototype.map = function () {
  return this._publicClientCluster.map.apply(this._publicClientCluster, arguments);
};


var Server = module.exports.Server = function (options) {
  var self = this;

  var dataServer;
  this._dataServers = [];
  this._shuttingDown = false;

  var readyCount = 0;
  var len = options.brokers.length;
  var firstTime = true;
  var startDebugPort = options.debug;
  var startInspectPort = options.inspect;

  var triggerBrokerStart = function (brokerInfo) {
    self.emit('brokerStart', brokerInfo);
  };

  for (var i = 0; i < len; i++) {
    var launchServer = function (i) {
      var socketPath = options.brokers[i];

      dataServer = scBroker.createServer({
        id: i,
        debug: startDebugPort ? startDebugPort + i : null,
        inspect: startInspectPort ? startInspectPort + i : null,
        instanceId: options.instanceId,
        socketPath: socketPath,
        secretKey: options.secretKey,
        expiryAccuracy: options.expiryAccuracy,
        downgradeToUser: options.downgradeToUser,
        brokerControllerPath: options.appBrokerControllerPath,
        processTermTimeout: options.processTermTimeout,
        ipcAckTimeout: options.ipcAckTimeout,
        brokerOptions: options.brokerOptions
      });

      self._dataServers[i] = dataServer;

      if (firstTime) {
        dataServer.on('ready', function (brokerInfo) {
          if (++readyCount >= options.brokers.length) {
            firstTime = false;
            self.emit('ready');
          }
          triggerBrokerStart({
            id: brokerInfo.id,
            pid: brokerInfo.pid,
            respawn: false
          });
        });
      } else {
        dataServer.on('ready', function (brokerInfo) {
          triggerBrokerStart({
            id: brokerInfo.id,
            pid: brokerInfo.pid,
            respawn: true
          });
        });
      }

      dataServer.on('error', function (err) {
        self.emit('error', err);
      });

      dataServer.on('exit', function (brokerInfo) {
        var exitMessage = 'Broker server at socket path ' + socketPath + ' exited with code ' + brokerInfo.code;
        if (brokerInfo.signal != null) {
          exitMessage += ' and signal ' + brokerInfo.signal;
        }
        var err = new ProcessExitError(exitMessage, brokerInfo.code);
        err.pid = process.pid;
        if (brokerInfo.signal != null) {
          err.signal = brokerInfo.signal;
        }
        self.emit('error', err);

        self.emit('brokerExit', {
          id: brokerInfo.id,
          pid: brokerInfo.pid,
          code: brokerInfo.code,
          signal: brokerInfo.signal
        });

        if (!self._shuttingDown) {
          launchServer(i);
        }
      });

      dataServer.on('brokerMessage', function (brokerId, data, callback) {
        self.emit('brokerMessage', brokerId, data, callback);
      });
    };

    launchServer(i);
  }
};

Server.prototype = Object.create(EventEmitter.prototype);

Server.prototype.sendToBroker = function (brokerId, data, callback) {
  var targetBroker = this._dataServers[brokerId];
  if (targetBroker) {
    targetBroker.sendToBroker(data, callback);
  } else {
    var err = new BrokerError('Broker with id ' + brokerId + ' does not exist');
    err.pid = process.pid;
    this.emit('error', err);
    callback && callback(err);
  }
};

Server.prototype.killBrokers = function () {
  for (var i in this._dataServers) {
    if (this._dataServers.hasOwnProperty(i)) {
      this._dataServers[i].destroy();
    }
  }
};

Server.prototype.destroy = function () {
  this._shuttingDown = true;
  this.killBrokers();
};


var Client = module.exports.Client = function (options) {
  var self = this;

  this.options = options;
  this._ready = false;

  var dataClient;
  var dataClients = [];

  for (var i in options.brokers) {
    if (options.brokers.hasOwnProperty(i)) {
      var socketPath = options.brokers[i];
      dataClient = scBroker.createClient({
        socketPath: socketPath,
        secretKey: options.secretKey,
        pubSubBatchDuration: options.pubSubBatchDuration,
        connectRetryErrorThreshold: options.connectRetryErrorThreshold
      });
      dataClients.push(dataClient);
    }
  }

  var hasher = function (key) {
    return hash(key, dataClients.length);
  };

  var channelMethods = {
    publish: true,
    subscribe: true,
    unsubscribe: true,
    isSubscribed: true
  };

  this._defaultMapper = function (key, method, clientIds) {
    if (channelMethods[method]) {
      if (key == null) {
        return clientIds;
      }
      return hasher(key);
    } else if (method === 'query' || method === 'exec' || method === 'send') {
      var mapIndex = key.mapIndex;
      if (mapIndex) {
        // A mapIndex of * means that the action should be sent to all
        // brokers in the cluster.
        if (mapIndex === '*') {
          return clientIds;
        } else {
          if (mapIndex instanceof Array) {
            var hashedIndexes = [];
            var len = mapIndex.length;
            for (var i = 0; i < len; i++) {
              hashedIndexes.push(hasher(mapIndex[i]));
            }
            return hashedIndexes;
          } else {
            return hasher(mapIndex);
          }
        }
      }
      return 0;
    } else if (method === 'removeAll') {
      return clientIds;
    }
    return hasher(key);
  };

  var emitError = function (error) {
    self.emit('error', error);
  };
  var emitWarning = function (warning) {
    self.emit('warning', warning);
  };

  // The user cannot change the _defaultMapper for _privateClientCluster.
  this._privateClientCluster = new ClientCluster(dataClients);
  this._privateClientCluster.setMapper(this._defaultMapper);
  this._privateClientCluster.on('error', emitError);
  this._privateClientCluster.on('warning', emitWarning);

  // The user can provide a custom mapper for _publicClientCluster.
  // The _defaultMapper is used by default.
  this._publicClientCluster = new ClientCluster(dataClients);
  this._publicClientCluster.setMapper(this._defaultMapper);
  this._publicClientCluster.on('error', emitError);
  this._publicClientCluster.on('warning', emitWarning);

  this._sockets = {};

  this._exchangeSubscriptions = {};
  this._exchangeClient = new SCExchange(this._privateClientCluster, this._publicClientCluster, this);

  this._clientSubscribers = {};
  this._clientSubscribersCounter = {};

  var readyNum = 0;
  var firstTime = true;

  var dataClientReady = function () {
    if (++readyNum >= dataClients.length && firstTime) {
      firstTime = false;
      self._ready = true;
      self.emit('ready');
    }
  };

  for (var j in dataClients) {
    if (dataClients.hasOwnProperty(j)) {
      dataClients[j].on('ready', dataClientReady);
    }
  }

  this._privateClientCluster.on('message', this._handleExchangeMessage.bind(this));
};

Client.prototype = Object.create(EventEmitter.prototype);

Client.prototype.destroy = function (callback) {
  this._privateClientCluster.removeAll(callback);
};

Client.prototype.on = function (event, listener) {
  if (event === 'ready' && this._ready) {
    listener();
  } else {
    EventEmitter.prototype.on.apply(this, arguments);
  }
};

Client.prototype.exchange = function () {
  return this._exchangeClient;
};

Client.prototype._dropUnusedSubscriptions = function (channel, callback) {
  var self = this;

  var subscriberCount = this._clientSubscribersCounter[channel];
  if (subscriberCount == null || subscriberCount <= 0) {
    delete this._clientSubscribers[channel];
    delete this._clientSubscribersCounter[channel];

    if (!this._exchangeSubscriptions[channel]) {
      self._privateClientCluster.unsubscribe(channel, callback);
      return;
    }
  }
  callback && callback();
};

Client.prototype.publish = function (channelName, data, callback) {
  this._privateClientCluster.publish(channelName, data, callback);
};

Client.prototype.subscribe = function (channel, callback) {
  var self = this;

  if (!this._exchangeSubscriptions[channel]) {
    this._exchangeSubscriptions[channel] = 'pending';
    this._privateClientCluster.subscribe(channel, function (err) {
      if (err) {
        delete self._exchangeSubscriptions[channel];
        self._dropUnusedSubscriptions(channel);
      } else {
        self._exchangeSubscriptions[channel] = true;
      }
      callback && callback(err);
    });
  } else {
    callback && callback();
  }
};

Client.prototype.unsubscribe = function (channel, callback) {
  delete this._exchangeSubscriptions[channel];
  this._dropUnusedSubscriptions(channel, callback);
};

Client.prototype.unsubscribeAll = function (callback) {
  var self = this;

  var tasks = [];
  for (var channel in this._exchangeSubscriptions) {
    if (this._exchangeSubscriptions.hasOwnProperty(channel)) {
      delete this._exchangeSubscriptions[channel];
      (function (channel) {
        tasks.push(function (cb) {
          self._dropUnusedSubscriptions(channel, cb);
        });
      })(channel);
    }
  }
  async.parallel(tasks, callback);
};

Client.prototype.isSubscribed = function (channel, includePending) {
  if (includePending) {
    return !!this._exchangeSubscriptions[channel];
  }
  return this._exchangeSubscriptions[channel] === true;
};

Client.prototype.subscribeSocket = function (socket, channel, callback) {
  var self = this;

  var addSubscription = function (err) {
    if (!err) {
      if (!self._clientSubscribers[channel]) {
        self._clientSubscribers[channel] = {};
        self._clientSubscribersCounter[channel] = 0;
      }
      if (!self._clientSubscribers[channel][socket.id]) {
        self._clientSubscribersCounter[channel]++;
      }
      self._clientSubscribers[channel][socket.id] = socket;
    }
    callback && callback(err);
  };

  this._privateClientCluster.subscribe(channel, addSubscription);
};

Client.prototype.unsubscribeSocket = function (socket, channel, callback) {
  var self = this;

  if (this._clientSubscribers[channel]) {
    if (this._clientSubscribers[channel][socket.id]) {
      this._clientSubscribersCounter[channel]--;
      delete this._clientSubscribers[channel][socket.id];

      if (this._clientSubscribersCounter[channel] <= 0) {
        delete this._clientSubscribers[channel];
        delete this._clientSubscribersCounter[channel];
      }
    }
  }
  this._dropUnusedSubscriptions(channel, function () {
    callback && callback.apply(self, arguments);
  });
};

Client.prototype.setSCServer = function (scServer) {
  this.scServer = scServer;
};

Client.prototype._handleExchangeMessage = function (channel, message, options) {
  var packet = {
    channel: channel,
    data: message
  };

  var emitOptions = {};
  if (this.scServer) {
    // Optimization
    try {
      emitOptions.stringifiedData = this.scServer.codec.encode({
        event: '#publish',
        data: packet
      });
    } catch (err) {
      this.emit('error', err);
      return;
    }
  }

  var subscriberSockets = this._clientSubscribers[channel];

  for (var i in subscriberSockets) {
    if (subscriberSockets.hasOwnProperty(i)) {
      subscriberSockets[i].emit('#publish', packet, null, emitOptions);
    }
  }

  this.emit('message', packet);
};
