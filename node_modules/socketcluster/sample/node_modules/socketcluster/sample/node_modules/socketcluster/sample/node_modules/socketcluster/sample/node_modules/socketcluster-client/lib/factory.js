var SCClientSocket = require('./scclientsocket');
var scErrors = require('sc-errors');
var uuid = require('uuid');
var InvalidArgumentsError = scErrors.InvalidArgumentsError;

var _clients = {};

function getMultiplexId(options) {
  var protocolPrefix = options.secure ? 'https://' : 'http://';
  var queryString = '';
  if (options.query) {
    if (typeof options.query == 'string') {
      queryString = options.query;
    } else {
      var queryArray = [];
      var queryMap = options.query;
      for (var key in queryMap) {
        if (queryMap.hasOwnProperty(key)) {
          queryArray.push(key + '=' + queryMap[key]);
        }
      }
      if (queryArray.length) {
        queryString = '?' + queryArray.join('&');
      }
    }
  }
  var host;
  if (options.host) {
    host = options.host;
  } else {
    host = options.hostname + ':' + options.port;
  }
  return protocolPrefix + host + options.path + queryString;
}

function isUrlSecure() {
  return global.location && location.protocol == 'https:';
}

function getPort(options, isSecureDefault) {
  var isSecure = options.secure == null ? isSecureDefault : options.secure;
  return options.port || (global.location && location.port ? location.port : isSecure ? 443 : 80);
}

function create(options) {
  var self = this;

  options = options || {};

  if (options.host && !options.host.match(/[^:]+:\d{2,5}/)) {
    throw new InvalidArgumentsError('The host option should include both' +
      ' the hostname and the port number in the format "hostname:port"');
  }

  if (options.host && options.hostname) {
    throw new InvalidArgumentsError('The host option should already include' +
      ' the hostname and the port number in the format "hostname:port"' +
      ' - Because of this, you should never use host and hostname options together');
  }

  if (options.host && options.port) {
    throw new InvalidArgumentsError('The host option should already include' +
      ' the hostname and the port number in the format "hostname:port"' +
      ' - Because of this, you should never use host and port options together');
  }

  var isSecureDefault = isUrlSecure();

  var opts = {
    port: getPort(options, isSecureDefault),
    hostname: global.location && location.hostname || 'localhost',
    path: '/socketcluster/',
    secure: isSecureDefault,
    autoConnect: true,
    autoReconnect: true,
    autoSubscribeOnConnect: true,
    connectTimeout: 20000,
    ackTimeout: 10000,
    timestampRequests: false,
    timestampParam: 't',
    authEngine: null,
    authTokenName: 'socketCluster.authToken',
    binaryType: 'arraybuffer',
    multiplex: true,
    pubSubBatchDuration: null,
    cloneData: false
  };
  for (var i in options) {
    if (options.hasOwnProperty(i)) {
      opts[i] = options[i];
    }
  }
  opts.clientMap = _clients;

  if (opts.multiplex === false) {
    opts.clientId = uuid.v4();
    var socket = new SCClientSocket(opts);
    _clients[opts.clientId] = socket;
    return socket;
  }
  opts.clientId = getMultiplexId(opts);

  if (_clients[opts.clientId]) {
    if (opts.autoConnect) {
      _clients[opts.clientId].connect();
    }
  } else {
    _clients[opts.clientId] = new SCClientSocket(opts);
  }
  return _clients[opts.clientId];
}

function destroy(socket) {
  socket.destroy();
}

module.exports = {
  create: create,
  destroy: destroy,
  clients: _clients
};
