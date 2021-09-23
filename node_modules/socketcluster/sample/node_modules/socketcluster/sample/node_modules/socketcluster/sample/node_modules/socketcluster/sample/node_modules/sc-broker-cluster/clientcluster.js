var async = require('async');
var EventEmitter = require('events').EventEmitter;

var ClientCluster = function (clients) {
  var self = this;

  var handleMessage = function () {
    var args = Array.prototype.slice.call(arguments);
    self.emit.apply(self, ['message'].concat(args));
  };

  clients.forEach(function (client) {
    client.on('message', handleMessage);
  });

  var i, method;
  var client = clients[0];
  var clientIds = [];

  var clientInterface = [
    'subscribe',
    'isSubscribed',
    'unsubscribe',
    'publish',
    'set',
    'getExpiry',
    'add',
    'concat',
    'get',
    'getRange',
    'getAll',
    'count',
    'registerDeathQuery',
    'exec',
    'query',
    'remove',
    'removeRange',
    'removeAll',
    'splice',
    'pop',
    'hasKey',
    'send',
    'end'
  ];

  var clientUtils = [
    'extractKeys',
    'extractValues'
  ];

  for (var i in clients) {
    if (clients.hasOwnProperty(i)) {
      var client = clients[i];
      client.on('error', function (error) {
        self.emit('error', error);
      });
      client.on('warning', function (warning) {
        self.emit('warning', warning);
      });
      client.id = i;
      clientIds.push(i);
    }
  }

  // Default mapper maps to all clients.
  var mapper = function () {
    return clientIds;
  };

  clientInterface.forEach(function (method) {
    self[method] = function () {
      var key = arguments[0];
      var lastArg = arguments[arguments.length - 1];
      var results = [];
      var mapOutput = self.detailedMap(key, method);
      var activeClients = mapOutput.targets;

      if (lastArg instanceof Function) {
        if (mapOutput.type == 'single') {
          activeClients[0][method].apply(activeClients[0], arguments);
        } else {
          var result;
          var tasks = [];
          var args = Array.prototype.slice.call(arguments, 0, -1);
          var cb = lastArg;
          var len = activeClients.length;

          for (var i = 0; i < len; i++) {
            (function (activeClient) {
              tasks.push(function () {
                var callback = arguments[arguments.length - 1];
                result = activeClient[method].apply(activeClient, args.concat(callback));
                results.push(result);
              });
            })(activeClients[i]);
          }
          async.parallel(tasks, cb);
        }
      } else {
        var len = activeClients.length;

        for (var i = 0; i < len; i++) {
          result = activeClients[i][method].apply(activeClients[i], arguments);
          results.push(result);
        }
      }
      return results;
    }
  });

  var multiKeyClientInterface = [
    'expire',
    'unexpire'
  ];

  multiKeyClientInterface.forEach(function (method) {
    self[method] = function () {
      var activeClients, activeClientsLen, mapping, key;
      var keys = arguments[0];
      var tasks = [];
      var results = [];
      var expiryMap = {};

      var cb = arguments[arguments.length - 1];
      var len = keys.length;

      for (var j = 0; j < len; j++) {
        key = keys[j];
        activeClients = self.map(key, method);
        activeClientsLen = activeClients.length;
        for (var k = 0; k < activeClientsLen; k++) {
          mapping = activeClients[k].id;
          if (expiryMap[mapping] == null) {
            expiryMap[mapping] = [];
          }
          expiryMap[mapping].push(key);
        }
      }

      var partArgs = Array.prototype.slice.call(arguments, 1, -1);

      for (mapping in expiryMap) {
        if (expiryMap.hasOwnProperty(mapping)) {
          (function (activeClient, expiryKeys) {
            var newArgs = [expiryKeys].concat(partArgs);
            tasks.push(function () {
              var callback = arguments[arguments.length - 1];
              var result = activeClient[method].apply(activeClient, newArgs.concat(callback));
              results.push(result);
            });
          })(clients[mapping], expiryMap[mapping]);
        }
      }
      async.parallel(tasks, cb);

      return results;
    };
  });

  clientUtils.forEach(function (method) {
    this[method] = client[method].bind(client);
  });

  this.setMapper = function (mapperFunction) {
    mapper = mapperFunction;
  };

  this.getMapper = function (mapperFunction) {
    return mapper;
  };

  this.detailedMap = function (key, method) {
    var result = mapper(key, method, clientIds);
    var targets, type;
    if (typeof result == 'number') {
      type = 'single';
      targets = [clients[result % clients.length]];
    } else {
      type = 'multi';
      if (result instanceof Array) {
        var dataClients = [];
        for (var i in result) {
          if (result.hasOwnProperty(i)) {
            dataClients.push(clients[result[i] % clients.length]);
          }
        }
        targets = dataClients;
      } else {
        targets = [];
      }
    }

    return {type: type, targets: targets};
  };

  this.map = function (key, method) {
    return self.detailedMap(key, method).targets;
  };
};

ClientCluster.prototype = Object.create(EventEmitter.prototype);

module.exports.ClientCluster = ClientCluster;
