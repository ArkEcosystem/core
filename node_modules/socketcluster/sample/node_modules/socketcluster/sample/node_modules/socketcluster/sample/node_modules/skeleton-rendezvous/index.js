var crypto = require('crypto');

function SkeletonRendezvousHasher(options) {
  options = options || {};
  if (options.fanout > 9) {
    throw new Error('The fanout option cannot be higher than 9');
  }
  this.fanout = options.fanout || 2;
  this.hashAlgorithm = options.hashAlgorithm || 'md5';
  this.targetClusterSize = options.targetClusterSize || 16;
  this.minClusterSize = options.minClusterSize || this.targetClusterSize;
  this.clusters = [];
  if (options.sites) {
    this.addSites(options.sites);
  }
};

SkeletonRendezvousHasher.prototype._logx = function (value, fanout) {
  return Math.log(value) / Math.log(fanout);
};

SkeletonRendezvousHasher.prototype._getvirtualLevelCount = function (value, fanout) {
  return Math.ceil(this._logx(value, fanout));
};

SkeletonRendezvousHasher.prototype.hash = function (key) {
  var hasher = crypto.createHash(this.hashAlgorithm);
  hasher.update(key);
  return hasher.digest('hex');
};

SkeletonRendezvousHasher.prototype.getSites = function () {
  var sites = [];
  this.clusters.forEach((clusterSites) => {
    clusterSites.forEach((site) => {
      sites.push(site);
    });
  });
  return sites;
};

SkeletonRendezvousHasher.prototype._generateClusters = function (sites) {
  var siteLookup = {};
  // Remove duplicates.
  sites = sites.filter((site) => {
    if (!siteLookup[site]) {
      siteLookup[site] = true;
      return true;
    }
    return false;
  });
  sites.sort();
  this.clusters = [];
  this.clusterCount = Math.ceil(sites.length / this.targetClusterSize);
  for (var i = 0; i < this.clusterCount; i++) {
    this.clusters[i] = [];
  }

  var clusterIndex = 0;
  sites.forEach((site) => {
    var cluster = this.clusters[clusterIndex];
    cluster.push(site);
    if (cluster.length >= this.targetClusterSize) {
      clusterIndex++;
    }
  });

  if (this.clusterCount > 1) {
    var lastCluster = this.clusters[this.clusterCount - 1];
    // If the last cluster doesn't meet minimum capacity requirements,
    // then we will spread out its sites evenly between other clusters.
    if (lastCluster.length < this.minClusterSize) {
      this.clusters.pop();
      this.clusterCount--;
      clusterIndex = 0;

      lastCluster.forEach((site) => {
        var cluster = this.clusters[clusterIndex];
        cluster.push(site);
        clusterIndex = (clusterIndex + 1) % this.clusterCount;
      });
    }
  }
  this.virtualLevelCount = this._getvirtualLevelCount(this.clusterCount, this.fanout);
};

// Time complexity O(n)
// where n is the total number of sites.
SkeletonRendezvousHasher.prototype.setSites = function (sitesToSet) {
  var sites = [].concat(sitesToSet);
  this._generateClusters(sites);
};

// Time complexity O(n)
// where n is the total number of sites.
SkeletonRendezvousHasher.prototype.addSites = function (sitesToAdd) {
  var sites = this.getSites().concat(sitesToAdd);
  this._generateClusters(sites);
};

// Time complexity O(n)
// where n is the total number of sites.
SkeletonRendezvousHasher.prototype.removeSites = function (sitesToRemove) {
  if (!Array.isArray(sitesToRemove)) {
    sitesToRemove = [sitesToRemove];
  }
  var removeSiteLookup = {};
  sitesToRemove.forEach((site) => {
    removeSiteLookup[site] = true;
  });
  var sites = this.getSites().filter((site) => {
    return !removeSiteLookup[site];
  });
  this._generateClusters(sites);
};

// Time complexity: O(log n)
// where n is the total number of sites.
SkeletonRendezvousHasher.prototype.findSite = function (key, salt) {
  var saltString;
  if (salt) {
    saltString = salt.toString();
  } else {
    salt = 0;
    saltString = '';
  }
  var path = '';

  for (var i = 0; i < this.virtualLevelCount; i++) {
    var highestHash = null;
    var targetVirtualGroup = 0;

    for (var j = 0; j < this.fanout; j++) {
      var currentHash = this.hash(key + saltString + i + j);
      if (!highestHash || currentHash > highestHash) {
        highestHash = currentHash;
        targetVirtualGroup = j;
      }
    }
    path += targetVirtualGroup.toString();
  }
  var targetClusterIndex = parseInt(path, this.fanout) || 0;
  var targetCluster = this.clusters[targetClusterIndex];

  if (targetCluster == null) {
    if (targetClusterIndex === 0) {
      // No available target.
      return null;
    }
    return this.findSite(key, salt + 1);
  }

  var keyIndexWithinCluster = this._findIndexWithHighestRandomWeight(key + salt + path, targetCluster);
  var targetSite = targetCluster[keyIndexWithinCluster];
  if (targetSite == null) {
    return this.findSite(key, salt + 1);
  }
  return targetSite;
};

SkeletonRendezvousHasher.prototype._findIndexWithHighestRandomWeight = function (item, list) {
  var targetIndex = 0;
  var highestHash = null;

  (list || []).forEach((candidate, index) => {
    var currentHash = this.hash(item + candidate);
    if (!highestHash || currentHash > highestHash) {
      highestHash = currentHash;
      targetIndex = index;
    }
  });
  return targetIndex;
};

module.exports = SkeletonRendezvousHasher;
