var EventEmitter = require('events').EventEmitter;
var SCChannel = require('sc-channel').SCChannel;

var SimpleExchange = function (broker) {
  this._broker = broker;
  this._channels = {};
  this._channelEmitter = new EventEmitter();
  this._messageHandler = this._handleChannelMessage.bind(this);

  this._broker.on('message', this._messageHandler);
};

SimpleExchange.prototype = Object.create(EventEmitter.prototype);

SimpleExchange.prototype.destroy = function () {
  this._broker.removeListener('message', this._messageHandler);
};

SimpleExchange.prototype._handleChannelMessage = function (message) {
  var channelName = message.channel;
  if (this.isSubscribed(channelName)) {
    this._channelEmitter.emit(channelName, message.data);
  }
};

SimpleExchange.prototype._triggerChannelSubscribe = function (channel) {
  var channelName = channel.name;

  channel.state = channel.SUBSCRIBED;

  channel.emit('subscribe', channelName);
  EventEmitter.prototype.emit.call(this, 'subscribe', channelName);
};

SimpleExchange.prototype._triggerChannelUnsubscribe = function (channel, newState) {
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

SimpleExchange.prototype.publish = function (channelName, data, callback) {
  this._broker.publish(channelName, data, callback);
};

SimpleExchange.prototype.subscribe = function (channelName) {
  var channel = this._channels[channelName];

  if (!channel) {
    channel = new SCChannel(channelName, this);
    this._channels[channelName] = channel;
  }

  if (channel.state === channel.UNSUBSCRIBED) {
    channel.state = channel.PENDING;
    this._triggerChannelSubscribe(channel);
  }
  return channel;
};

SimpleExchange.prototype.unsubscribe = function (channelName) {
  var channel = this._channels[channelName];

  if (channel) {
    if (channel.state !== channel.UNSUBSCRIBED) {
      this._triggerChannelUnsubscribe(channel);
    }
  }
};

SimpleExchange.prototype.channel = function (channelName) {
  var currentChannel = this._channels[channelName];

  if (!currentChannel) {
    currentChannel = new SCChannel(channelName, this);
    this._channels[channelName] = currentChannel;
  }
  return currentChannel;
};

SimpleExchange.prototype.destroyChannel = function (channelName) {
  var channel = this._channels[channelName];
  channel.unwatch();
  channel.unsubscribe();
  delete this._channels[channelName];
};

SimpleExchange.prototype.subscriptions = function (includePending) {
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

SimpleExchange.prototype.isSubscribed = function (channelName, includePending) {
  var channel = this._channels[channelName];
  if (includePending) {
    return !!channel && (channel.state === channel.SUBSCRIBED ||
      channel.state === channel.PENDING);
  }
  return !!channel && channel.state === channel.SUBSCRIBED;
};

SimpleExchange.prototype.watch = function (channelName, handler) {
  this._channelEmitter.on(channelName, handler);
};

SimpleExchange.prototype.unwatch = function (channelName, handler) {
  if (handler) {
    this._channelEmitter.removeListener(channelName, handler);
  } else {
    this._channelEmitter.removeAllListeners(channelName);
  }
};

SimpleExchange.prototype.watchers = function (channelName) {
  return this._channelEmitter.listeners(channelName);
};


var SCSimpleBroker = function () {
  var self = this;

  this._exchangeClient = new SimpleExchange(this);
  this._clientSubscribers = {};
  this._clientSubscribersCounter = {};

  process.nextTick(function () {
    self.emit('ready');
  });
};

SCSimpleBroker.prototype = Object.create(EventEmitter.prototype);

SCSimpleBroker.prototype.exchange = function () {
  return this._exchangeClient;
};

SCSimpleBroker.prototype.subscribeSocket = function (socket, channel, callback) {
  if (!this._clientSubscribers[channel]) {
    this._clientSubscribers[channel] = {};
    this._clientSubscribersCounter[channel] = 0;
  }
  if (!this._clientSubscribers[channel][socket.id]) {
    this._clientSubscribersCounter[channel]++;
  }
  this._clientSubscribers[channel][socket.id] = socket;
  callback && callback();
};

SCSimpleBroker.prototype.unsubscribeSocket = function (socket, channel, callback) {
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
  callback && callback();
};

SCSimpleBroker.prototype.publish = function (channelName, data, callback) {
  this._handleExchangeMessage(channelName, data, callback);
  callback && callback();
};

SCSimpleBroker.prototype._handleExchangeMessage = function (channel, message, options) {
  var packet = {
    channel: channel,
    data: message
  };

  var subscriberSockets = this._clientSubscribers[channel];

  for (var i in subscriberSockets) {
    if (subscriberSockets.hasOwnProperty(i)) {
      subscriberSockets[i].emit('#publish', packet);
    }
  }

  this.emit('message', packet);
};

module.exports.SCSimpleBroker = SCSimpleBroker;
