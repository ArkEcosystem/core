var url = require('url');
var scClient = require('socketcluster-client');
var EventEmitter = require('events').EventEmitter;
var Hasher = require('./hasher');

var trailingPortNumberRegex = /:[0-9]+$/;

function ClientPool(options) {
  var self = this;
  EventEmitter.call(this);

  options = options || {};
  this.hasher = new Hasher();
  this.clientCount = options.clientCount || 1;
  this.targetURI = options.targetURI;
  this.authKey = options.authKey;

  this.areClientListenersBound = false;

  var clientConnectOptions = this.breakDownURI(this.targetURI);
  clientConnectOptions.query = {
    authKey: this.authKey
  };

  this._handleClientError = function (err) {
    self.emit('error', err);
  };
  this._handleClientSubscribe = function (channelName) {
    var client = this;
    self.emit('subscribe', {
      targetURI: self.targetURI,
      poolIndex: client.poolIndex,
      channel: channelName
    });
  };
  this._handleClientSubscribeFail = function (err, channelName) {
    var client = this;
    self.emit('subscribeFail', {
      targetURI: self.targetURI,
      poolIndex: client.poolIndex,
      error: err,
      channel: channelName
    });
  };

  this.clients = [];

  for (var i = 0; i < this.clientCount; i++) {
    var connectOptions = Object.assign({}, clientConnectOptions);
    connectOptions.query.poolIndex = i;
    var client = scClient.create(connectOptions);
    client.poolIndex = i;
    client.on('error', this._handleClientError);
    this.clients.push(client);
  }
}

ClientPool.prototype = Object.create(EventEmitter.prototype);

ClientPool.prototype.bindClientListeners = function () {
  this.unbindClientListeners();
  this.clients.forEach((client) => {
    client.on('error', this._handleClientError);
    client.on('subscribe', this._handleClientSubscribe);
    client.on('subscribeFail', this._handleClientSubscribeFail);
  });
  this.areClientListenersBound = true;
};

ClientPool.prototype.unbindClientListeners = function () {
  this.clients.forEach((client) => {
    client.removeListener('error', this._handleClientError);
    client.removeListener('subscribe', this._handleClientSubscribe);
    client.removeListener('subscribeFail', this._handleClientSubscribeFail);
  });
  this.areClientListenersBound = false;
};

ClientPool.prototype.breakDownURI = function (uri) {
  var parsedURI = url.parse(uri);
  var hostname = parsedURI.host.replace(trailingPortNumberRegex, '');
  var result = {
    hostname: hostname,
    port: parsedURI.port
  };
  if (parsedURI.protocol == 'wss:' || parsedURI.protocol == 'https:') {
    result.secure = true;
  }
  return result;
};

ClientPool.prototype.selectClient = function (key) {
  var targetIndex = this.hasher.hashToIndex(key, this.clients.length);
  return this.clients[targetIndex];
};

ClientPool.prototype.publish = function (channelName, data) {
  var targetClient = this.selectClient(channelName);
  if (this.areClientListenersBound) {
    return targetClient.publish(channelName, data, (err) => {
      if (!this.areClientListenersBound) {
        return;
      }
      if (err) {
        this.emit('publishFail', {
          targetURI: this.targetURI,
          poolIndex: targetClient.poolIndex,
          channel: channelName,
          data: data
        });
        return;
      }
      this.emit('publish', {
        targetURI: this.targetURI,
        poolIndex: targetClient.poolIndex,
        channel: channelName,
        data: data
      });
    });
  }
  return targetClient.publish(channelName, data);
};

ClientPool.prototype.subscriptions = function (includePending) {
  var subscriptionList = [];
  this.clients.forEach((client) => {
    var clientSubList = client.subscriptions(includePending);
    clientSubList.forEach((subscription) => {
      subscriptionList.push(subscription);
    });
  });
  return subscriptionList;
};

ClientPool.prototype.subscribeAndWatch = function (channelName, handler) {
  var targetClient = this.selectClient(channelName);
  targetClient.subscribe(channelName);
  if (!targetClient.watchers(channelName).length) {
    targetClient.watch(channelName, (data) => {
      handler(data);
    });
  }
};

ClientPool.prototype.destroyChannel = function (channelName) {
  var targetClient = this.selectClient(channelName);
  return targetClient.destroyChannel(channelName);
};

ClientPool.prototype.destroy = function () {
  this.clients.forEach((client) => {
    client.destroy();
  });
};

module.exports = ClientPool;
