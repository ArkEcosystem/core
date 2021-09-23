var SkeletonRendezvousHasher = require('skeleton-rendezvous');

function SkeletonRendezvousMapper(options) {
  this.hasher = new SkeletonRendezvousHasher(options);
}

SkeletonRendezvousMapper.prototype.setSites = function (sites) {
  this.hasher.setSites(sites);
};

SkeletonRendezvousMapper.prototype.getSites = function () {
  return this.hasher.getSites();
};

SkeletonRendezvousMapper.prototype.findSite = function (key) {
  return this.hasher.findSite(key);
};

module.exports = SkeletonRendezvousMapper;
