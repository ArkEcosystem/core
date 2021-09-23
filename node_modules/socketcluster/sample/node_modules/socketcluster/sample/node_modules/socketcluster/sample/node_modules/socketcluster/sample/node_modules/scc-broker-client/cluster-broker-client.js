var ClientPool = require('./client-pool');
var EventEmitter = require('events').EventEmitter;
var SimpleMapper = require('./mappers/simple-mapper');
var SkeletonRendezvousMapper = require('./mappers/skeleton-rendezvous-mapper');

var ClusterBrokerClient = function (broker, options) {
  options = options || {};
  EventEmitter.call(this);
  this.broker = broker;
  this.sccBrokerClientPools = {};
  this.sccBrokerURIList = [];
  this.authKey = options.authKey || null;
  this.mappingEngine = options.mappingEngine || 'skeletonRendezvous';
  this.clientPoolSize = options.clientPoolSize || 1;

  if (this.mappingEngine === 'skeletonRendezvous') {
    this.mapper = new SkeletonRendezvousMapper(options.mappingEngineOptions);
  } else if (this.mappingEngine === 'simple') {
    this.mapper = new SimpleMapper(options.mappingEngineOptions);
  } else {
    if (typeof this.mappingEngine !== 'object') {
      throw new Error(`The specified mappingEngine '${this.mappingEngine}' is not a valid engine - It must be either 'simple', 'skeletonRendezvous' or a custom mappingEngine instance`);
    }
    this.mapper = this.mappingEngine;
  }
};

ClusterBrokerClient.prototype = Object.create(EventEmitter.prototype);

ClusterBrokerClient.prototype.errors = {
  NoMatchingSubscribeTargetError: function (channelName) {
    var err = new Error(`Could not find a matching subscribe target scc-broker for the ${channelName} channel - The scc-broker may be down.`);
    err.name = 'NoMatchingSubscribeTargetError';
    return err;
  },
  NoMatchingUnsubscribeTargetError: function (channelName) {
    var err = new Error(`Could not find a matching unsubscribe target scc-broker for the ${channelName} channel - The scc-broker may be down.`);
    err.name = 'NoMatchingUnsubscribeTargetError';
    return err;
  },
  NoMatchingPublishTargetError: function (channelName) {
    var err = new Error(`Could not find a matching publish target scc-broker for the ${channelName} channel - The scc-broker may be down.`);
    err.name = 'NoMatchingPublishTargetError';
    return err;
  }
};

ClusterBrokerClient.prototype.mapChannelNameToBrokerURI = function (channelName) {
  return this.mapper.findSite(channelName);
};

ClusterBrokerClient.prototype.setBrokers = function (sccBrokerURIList) {
  this.sccBrokerURIList = sccBrokerURIList.concat();
  this.mapper.setSites(this.sccBrokerURIList);

  var brokerClientMap = {};
  var fullSubscriptionList = this.getAllSubscriptions();

  this.sccBrokerURIList.forEach((clientURI) => {
    var previousClientPool = this.sccBrokerClientPools[clientURI];
    if (previousClientPool) {
      previousClientPool.unbindClientListeners();
      previousClientPool.removeAllListeners();
    }
    var clientPool = new ClientPool({
      clientCount: this.clientPoolSize,
      targetURI: clientURI,
      authKey: this.authKey
    });
    clientPool.on('error', (err) => {
      this.emit('error', err);
    });
    clientPool.on('subscribe', (data) => {
      this.emit('subscribe', data);
    });
    clientPool.on('subscribeFail', (data) => {
      this.emit('subscribeFail', data);
    });
    clientPool.on('publish', (data) => {
      this.emit('publish', data);
    });
    clientPool.on('publishFail', (data) => {
      this.emit('publishFail', data);
    });
    clientPool.bindClientListeners();
    brokerClientMap[clientURI] = clientPool;
    this.sccBrokerClientPools[clientURI] = clientPool;
  });

  var unusedSCCBrokerURIList = Object.keys(this.sccBrokerClientPools).filter((clientURI) => {
    return !brokerClientMap[clientURI];
  });
  unusedSCCBrokerURIList.forEach((clientURI) => {
    var unusedClientPool = this.sccBrokerClientPools[clientURI];
    unusedClientPool.destroy();
    delete this.sccBrokerClientPools[clientURI];
  });

  var newSubscriptionsMap = {};
  fullSubscriptionList.forEach((channelName) => {
    var targetSCCBrokerURI = this.mapChannelNameToBrokerURI(channelName);
    if (!newSubscriptionsMap[targetSCCBrokerURI]) {
      newSubscriptionsMap[targetSCCBrokerURI] = {};
    }
    if (!newSubscriptionsMap[targetSCCBrokerURI][channelName]) {
      newSubscriptionsMap[targetSCCBrokerURI][channelName] = true;
    }
  });

  Object.keys(this.sccBrokerClientPools).forEach((clientURI) => {
    var targetClientPool = this.sccBrokerClientPools[clientURI];
    var newChannelLookup = newSubscriptionsMap[clientURI] || {};

    var existingChannelList = targetClientPool.subscriptions(true);
    existingChannelList.forEach((channelName) => {
      if (!newChannelLookup[channelName]) {
        targetClientPool.destroyChannel(channelName);
      }
    });

    var newChannelList = Object.keys(newChannelLookup);
    newChannelList.forEach((channelName) => {
      this._subscribeClientPoolToChannelAndWatch(targetClientPool, channelName);
    });
  });
};

ClusterBrokerClient.prototype._getAllUpstreamBrokerSubscriptions = function () {
  var channelMap = {};
  var workerChannelMaps = Object.keys(this.broker.subscriptions);
  workerChannelMaps.forEach((index) => {
    var workerChannels = Object.keys(this.broker.subscriptions[index]);
    workerChannels.forEach((channelName) => {
      channelMap[channelName] = true;
    });
  });
  return Object.keys(channelMap);
};

ClusterBrokerClient.prototype.getAllSubscriptions = function () {
  var visitedClientLookup = {};
  var channelLookup = {};

  Object.keys(this.sccBrokerClientPools).forEach((clientURI) => {
    var clientPool = this.sccBrokerClientPools[clientURI];
    if (!visitedClientLookup[clientURI]) {
      visitedClientLookup[clientURI] = true;
      var subs = clientPool.subscriptions(true);
      subs.forEach((channelName) => {
        if (!channelLookup[channelName]) {
          channelLookup[channelName] = true;
        }
      });
    }
  });
  var localBrokerSubscriptions = this._getAllUpstreamBrokerSubscriptions();
  localBrokerSubscriptions.forEach((channelName) => {
    channelLookup[channelName] = true;
  });
  return Object.keys(channelLookup);
};

ClusterBrokerClient.prototype._handleChannelMessage = function (channelName, packet) {
  this.emit('message', channelName, packet);
};

ClusterBrokerClient.prototype._subscribeClientPoolToChannelAndWatch = function (clientPool, channelName) {
  clientPool.subscribeAndWatch(channelName, (data) => {
    this._handleChannelMessage(channelName, data);
  });
};

ClusterBrokerClient.prototype.subscribe = function (channelName) {
  var targetSCCBrokerURI = this.mapChannelNameToBrokerURI(channelName);
  var targetSCCBrokerClientPool = this.sccBrokerClientPools[targetSCCBrokerURI];
  if (targetSCCBrokerClientPool) {
    this._subscribeClientPoolToChannelAndWatch(targetSCCBrokerClientPool, channelName);
  } else {
    var err = this.errors.NoMatchingSubscribeTargetError(channelName);
    this.emit('error', err);
  }
};

ClusterBrokerClient.prototype.unsubscribe = function (channelName) {
  var targetSCCBrokerURI = this.mapChannelNameToBrokerURI(channelName);
  var targetSCCBrokerClientPool = this.sccBrokerClientPools[targetSCCBrokerURI];
  if (targetSCCBrokerClientPool) {
    targetSCCBrokerClientPool.destroyChannel(channelName);
  } else {
    var err = this.errors.NoMatchingUnsubscribeTargetError(channelName);
    this.emit('error', err);
  }
};

ClusterBrokerClient.prototype.publish = function (channelName, data) {
  var targetSCCBrokerURI = this.mapChannelNameToBrokerURI(channelName);
  var targetSCCBrokerClientPool = this.sccBrokerClientPools[targetSCCBrokerURI];
  if (targetSCCBrokerClientPool) {
    targetSCCBrokerClientPool.publish(channelName, data);
  } else {
    var err = this.errors.NoMatchingPublishTargetError(channelName);
    this.emit('error', err);
  }
};

module.exports = ClusterBrokerClient;
