var cloneDeep = require('lodash.clonedeep');
var Emitter = require('component-emitter');
var Response = require('./response').Response;

var scErrors = require('sc-errors');
var InvalidArgumentsError = scErrors.InvalidArgumentsError;
var SocketProtocolError = scErrors.SocketProtocolError;
var TimeoutError = scErrors.TimeoutError;
var InvalidActionError = scErrors.InvalidActionError;


var SCServerSocket = function (id, server, socket) {
  var self = this;

  Emitter.call(this);

  this._localEvents = {
    'subscribe': 1,
    'unsubscribe': 1,
    'connect': 1,
    '_connect': 1,
    'disconnect': 1,
    '_disconnect': 1,
    'connectAbort': 1,
    '_connectAbort': 1,
    'close': 1,
    '_close': 1,
    'message': 1,
    'error': 1,
    'authStateChange': 1,
    'authTokenSigned': 1,
    'authenticate': 1,
    'deauthenticate': 1,
    'badAuthToken': 1,
    'raw': 1
  };

  this._autoAckEvents = {
    '#publish': 1
  };

  this.id = id;
  this.server = server;
  this.socket = socket;
  this.state = this.CONNECTING;
  this.authState = this.UNAUTHENTICATED;
  this.active = true;

  this.request = this.socket.upgradeReq || {};

  var wsEngine = this.server.options.wsEngine;
  if (wsEngine === 'sc-uws' || wsEngine === 'uws') {
    this.request.connection = this.socket._socket;
  }
  if (this.request.connection) {
    this.remoteAddress = this.request.connection.remoteAddress;
    this.remoteFamily = this.request.connection.remoteFamily;
    this.remotePort = this.request.connection.remotePort;
  } else {
    this.remoteAddress = this.request.remoteAddress;
    this.remoteFamily = this.request.remoteFamily;
    this.remotePort = this.request.remotePort;
  }
  if (this.request.forwardedForAddress) {
    this.forwardedForAddress = this.request.forwardedForAddress;
  }

  this._cid = 1;
  this._callbackMap = {};
  this._batchSendList = [];

  this.channelSubscriptions = {};
  this.channelSubscriptionsCount = 0;

  this.socket.on('error', function (err) {
    Emitter.prototype.emit.call(self, 'error', err);
  });

  this.socket.on('close', function (code, data) {
    self._onSCClose(code, data);
  });

  if (!this.server.pingTimeoutDisabled) {
    this._pingIntervalTicker = setInterval(this._sendPing.bind(this), this.server.pingInterval);
  }
  this._resetPongTimeout();

  // Receive incoming raw messages
  this.socket.on('message', function (message, flags) {
    self._resetPongTimeout();

    Emitter.prototype.emit.call(self, 'message', message);

    var obj;
    try {
      obj = self.decode(message);
    } catch (err) {
      if (err.name === 'Error') {
        err.name = 'InvalidMessageError';
      }
      Emitter.prototype.emit.call(self, 'error', err);
      if (
        self.server.strictHandshake &&
        self.state === self.CONNECTING
      ) {
        self._onSCClose(4009);
        self.socket.close(4009);
      }
      return;
    }

    if (
      self.server.strictHandshake &&
      self.state === self.CONNECTING &&
      (!obj || obj.event !== '#handshake')
    ) {
      self._onSCClose(4009);
      self.socket.close(4009);
      return;
    }

    // If pong
    if (obj === '#2') {
      var token = self.getAuthToken();
      if (self.server.isAuthTokenExpired(token)) {
        self.deauthenticate();
      }
    } else {
      if (Array.isArray(obj)) {
        var len = obj.length;
        for (var i = 0; i < len; i++) {
          self._handleEventObject(obj[i], message);
        }
      } else {
        self._handleEventObject(obj, message);
      }
    }
  });
};

SCServerSocket.prototype = Object.create(Emitter.prototype);

SCServerSocket.CONNECTING = SCServerSocket.prototype.CONNECTING = 'connecting';
SCServerSocket.OPEN = SCServerSocket.prototype.OPEN = 'open';
SCServerSocket.CLOSED = SCServerSocket.prototype.CLOSED = 'closed';

SCServerSocket.AUTHENTICATED = SCServerSocket.prototype.AUTHENTICATED = 'authenticated';
SCServerSocket.UNAUTHENTICATED = SCServerSocket.prototype.UNAUTHENTICATED = 'unauthenticated';

SCServerSocket.ignoreStatuses = scErrors.socketProtocolIgnoreStatuses;
SCServerSocket.errorStatuses = scErrors.socketProtocolErrorStatuses;

SCServerSocket.prototype._sendPing = function () {
  if (this.state !== this.CLOSED) {
    this.sendObject('#1');
  }
};

SCServerSocket.prototype._handleEventObject = function (obj, message) {
  var self = this;
  if (obj && obj.event != null) {
    var eventName = obj.event;

    if (self._localEvents[eventName] == null) {
      var response = new Response(self, obj.cid);
      self.server.verifyInboundEvent(self, eventName, obj.data, function (err, newEventData, ackData) {
        if (err) {
          response.error(err, ackData);
        } else {
          if (eventName === '#disconnect') {
            var disconnectData = newEventData || {};
            self._onSCClose(disconnectData.code, disconnectData.data);
          } else {
            if (self._autoAckEvents[eventName]) {
              if (ackData !== undefined) {
                response.end(ackData);
              } else {
                response.end();
              }
              Emitter.prototype.emit.call(self, eventName, newEventData);
            } else {
              Emitter.prototype.emit.call(self, eventName, newEventData, response.callback.bind(response));
            }
          }
        }
      });
    }
  } else if (obj && obj.rid != null) {
    // If incoming message is a response to a previously sent message
    var ret = self._callbackMap[obj.rid];
    if (ret) {
      clearTimeout(ret.timeout);
      delete self._callbackMap[obj.rid];
      var rehydratedError = scErrors.hydrateError(obj.error);
      ret.callback(rehydratedError, obj.data);
    }
  } else {
    // The last remaining case is to treat the message as raw
    Emitter.prototype.emit.call(self, 'raw', message);
  }
};

SCServerSocket.prototype._resetPongTimeout = function () {
  if (this.server.pingTimeoutDisabled) {
    return;
  }
  var self = this;

  clearTimeout(this._pingTimeoutTicker);
  this._pingTimeoutTicker = setTimeout(function() {
    self._onSCClose(4001);
    self.socket.close(4001);
  }, this.server.pingTimeout);
};

SCServerSocket.prototype._nextCallId = function () {
  return this._cid++;
};

SCServerSocket.prototype.getState = function () {
  return this.state;
};

SCServerSocket.prototype.getBytesReceived = function () {
  return this.socket.bytesReceived;
};

SCServerSocket.prototype._onSCClose = function (code, data) {
  clearInterval(this._pingIntervalTicker);
  clearTimeout(this._pingTimeoutTicker);

  if (this.state !== this.CLOSED) {
    var prevState = this.state;
    this.state = this.CLOSED;

    if (prevState === this.CONNECTING) {
      // Private connectAbort event for internal use only
      Emitter.prototype.emit.call(this, '_connectAbort', code, data);
      Emitter.prototype.emit.call(this, 'connectAbort', code, data);
    } else {
      // Private disconnect event for internal use only
      Emitter.prototype.emit.call(this, '_disconnect', code, data);
      Emitter.prototype.emit.call(this, 'disconnect', code, data);
    }
    // Private close event for internal use only
    Emitter.prototype.emit.call(this, '_close', code, data);
    Emitter.prototype.emit.call(this, 'close', code, data);

    if (!SCServerSocket.ignoreStatuses[code]) {
      var closeMessage;
      if (data) {
        var reasonString;
        if (typeof data === 'object') {
          try {
            reasonString = JSON.stringify(data);
          } catch (error) {
            reasonString = data.toString();
          }
        } else {
          reasonString = data;
        }
        closeMessage = 'Socket connection closed with status code ' + code + ' and reason: ' + reasonString;
      } else {
        closeMessage = 'Socket connection closed with status code ' + code;
      }
      var err = new SocketProtocolError(SCServerSocket.errorStatuses[code] || closeMessage, code);
      Emitter.prototype.emit.call(this, 'error', err);
    }
  }
};

SCServerSocket.prototype.disconnect = function (code, data) {
  code = code || 1000;

  if (typeof code !== 'number') {
    var err = new InvalidArgumentsError('If specified, the code argument must be a number');
    Emitter.prototype.emit.call(this, 'error', err);
  }

  if (this.state !== this.CLOSED) {
    var packet = {
      code: code,
      data: data
    };
    this.emit('#disconnect', packet);
    this._onSCClose(code, data);
    this.socket.close(code);
  }
};

SCServerSocket.prototype.destroy = function (code, data) {
  this.active = false;
  this.disconnect(code, data);
};

SCServerSocket.prototype.terminate = function () {
  this.socket.terminate();
};

SCServerSocket.prototype.send = function (data, options) {
  var self = this;

  this.socket.send(data, options, function (err) {
    if (err) {
      self._onSCClose(1006, err.toString());
    }
  });
};

SCServerSocket.prototype.decode = function (message) {
  return this.server.codec.decode(message);
};

SCServerSocket.prototype.encode = function (object) {
  return this.server.codec.encode(object);
};

SCServerSocket.prototype.sendObjectBatch = function (object) {
  var self = this;

  this._batchSendList.push(object);
  if (this._batchTimeout) {
    return;
  }

  this._batchTimeout = setTimeout(function () {
    delete self._batchTimeout;
    if (self._batchSendList.length) {
      var str;
      try {
        str = self.encode(self._batchSendList);
      } catch (err) {
        Emitter.prototype.emit.call(self, 'error', err);
      }
      if (str != null) {
        self.send(str);
      }
      self._batchSendList = [];
    }
  }, this.server.options.pubSubBatchDuration || 0);
};

SCServerSocket.prototype.sendObjectSingle = function (object) {
  var str;
  try {
    str = this.encode(object);
  } catch (err) {
    Emitter.prototype.emit.call(this, 'error', err);
  }
  if (str != null) {
    this.send(str);
  }
};

SCServerSocket.prototype.sendObject = function (object, options) {
  if (options && options.batch) {
    this.sendObjectBatch(object);
  } else {
    this.sendObjectSingle(object);
  }
};

SCServerSocket.prototype.emit = function (event, data, callback, options) {
  var self = this;

  if (this._localEvents[event] == null) {
    this.server.verifyOutboundEvent(this, event, data, options, function (err, newData) {
      var eventObject = {
        event: event
      };
      if (newData !== undefined) {
        eventObject.data = newData;
      }

      if (err) {
        if (callback) {
          eventObject.cid = self._nextCallId();
          callback(err, eventObject);
        }
      } else {
        if (callback) {
          eventObject.cid = self._nextCallId();
          var timeout = setTimeout(function () {
            var error = new TimeoutError("Event response for '" + event + "' timed out");

            delete self._callbackMap[eventObject.cid];
            callback(error, eventObject);
          }, self.server.ackTimeout);

          self._callbackMap[eventObject.cid] = {callback: callback, timeout: timeout};
        }
        if (options && options.useCache && options.stringifiedData != null) {
          // Optimized
          self.send(options.stringifiedData);
        } else {
          self.sendObject(eventObject);
        }
      }
    });
  } else if (event === 'error') {
    Emitter.prototype.emit.call(this, event, data);
  } else {
    var error = new InvalidActionError('The "' + event + '" event is reserved and cannot be emitted on a server socket');
    Emitter.prototype.emit.call(this, 'error', error);
  }
};

SCServerSocket.prototype.triggerAuthenticationEvents = function (oldState) {
  if (oldState !== this.AUTHENTICATED) {
    var stateChangeData = {
      oldState: oldState,
      newState: this.authState,
      authToken: this.authToken
    };
    Emitter.prototype.emit.call(this, 'authStateChange', stateChangeData);
    this.server.emit('authenticationStateChange', this, stateChangeData);
  }
  Emitter.prototype.emit.call(this, 'authenticate', this.authToken);
  this.server.emit('authentication', this, this.authToken);
};

SCServerSocket.prototype.setAuthToken = function (data, options, callback) {
  var self = this;

  var authToken = cloneDeep(data);
  var oldState = this.authState;
  this.authState = this.AUTHENTICATED;

  if (options == null) {
    options = {};
  } else {
    options = cloneDeep(options);
    if (options.algorithm != null) {
      delete options.algorithm;
      var err = new InvalidArgumentsError('Cannot change auth token algorithm at runtime - It must be specified as a config option on launch');
      Emitter.prototype.emit.call(this, 'error', err);
    }
  }

  options.mutatePayload = true;

  var defaultSignatureOptions = this.server.defaultSignatureOptions;

  // We cannot have the exp claim on the token and the expiresIn option
  // set at the same time or else auth.signToken will throw an error.
  var expiresIn;
  if (options.expiresIn == null) {
    expiresIn = defaultSignatureOptions.expiresIn;
  } else {
    expiresIn = options.expiresIn;
  }
  if (authToken) {
    if (authToken.exp == null) {
      options.expiresIn = expiresIn;
    } else {
      delete options.expiresIn;
    }
  } else {
    options.expiresIn = expiresIn;
  }

  // Always use the default sync/async signing mode since it cannot be changed at runtime.
  if (defaultSignatureOptions.async != null) {
    options.async = defaultSignatureOptions.async;
  }
  // Always use the default algorithm since it cannot be changed at runtime.
  if (defaultSignatureOptions.algorithm != null) {
    options.algorithm = defaultSignatureOptions.algorithm;
  }

  this.authToken = authToken;

  this.server.auth.signToken(authToken, this.server.signatureKey, options, function (err, signedToken) {
    if (err) {
      Emitter.prototype.emit.call(self, 'error', err);
      self._onSCClose(4002, err.toString());
      self.socket.close(4002);
      callback && callback(err);
    } else {
      var tokenData = {
        token: signedToken
      };
      if (self.authToken === authToken) {
        self.signedAuthToken = signedToken;
        Emitter.prototype.emit.call(self, 'authTokenSigned', signedToken);
      }
      self.emit('#setAuthToken', tokenData, callback);
    }
  });

  this.triggerAuthenticationEvents(oldState);
};

SCServerSocket.prototype.getAuthToken = function () {
  return this.authToken;
};

SCServerSocket.prototype.deauthenticateSelf = function () {
  var oldState = this.authState;
  var oldToken = this.authToken;
  this.signedAuthToken = null;
  this.authToken = null;
  this.authState = this.UNAUTHENTICATED;
  if (oldState !== this.UNAUTHENTICATED) {
    var stateChangeData = {
      oldState: oldState,
      newState: this.authState
    };
    Emitter.prototype.emit.call(this, 'authStateChange', stateChangeData);
    this.server.emit('authenticationStateChange', this, stateChangeData);
  }
  Emitter.prototype.emit.call(this, 'deauthenticate', oldToken);
  this.server.emit('deauthentication', this, oldToken);
};

SCServerSocket.prototype.deauthenticate = function (callback) {
  this.deauthenticateSelf();
  this.emit('#removeAuthToken', null, callback);
};

SCServerSocket.prototype.kickOut = function (channel, message, callback) {
  var self = this;

  if (channel == null) {
    Object.keys(this.channelSubscriptions).forEach(function (channelName) {
      delete self.channelSubscriptions[channelName];
      self.channelSubscriptionsCount--;
      self.emit('#kickOut', {message: message, channel: channelName});
    });
  } else {
    delete this.channelSubscriptions[channel];
    this.channelSubscriptionsCount--;
    this.emit('#kickOut', {message: message, channel: channel});
  }
  this.server.brokerEngine.unsubscribeSocket(this, channel, callback);
};

SCServerSocket.prototype.subscriptions = function () {
  var subs = [];
  for (var i in this.channelSubscriptions) {
    if (this.channelSubscriptions.hasOwnProperty(i)) {
      subs.push(i);
    }
  }
  return subs;
};

SCServerSocket.prototype.isSubscribed = function (channel) {
  return !!this.channelSubscriptions[channel];
};

module.exports = SCServerSocket;
