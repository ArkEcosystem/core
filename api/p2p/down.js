const Peer = require('./peer.js');
const logger = require('../../core/logger');

class Down {
  constructor(config){
    this.config = config;
    this.peers = {};
    config.network.peers.forEach((peer) => this.peers[peer.ip] = new Peer(peer.ip, peer.port, config), this);
  }

  start(p2p){
    this.p2p = p2p;
    return this.updateNetworkStatus();
  }

  updateNetworkStatus(){
    return this
      .cleanPeers()
      .then(() => this.discoverPeers())
      .then(() => this.cleanPeers());
  }


  stop(){
    // Noop
  }

  cleanPeers(){
    let keys = Object.keys(this.peers);
    const that = this;
    return Promise.all(keys.map((ip) =>
      that.peers[ip]
        .ping()
        .catch(() => {
          delete that.peers[ip];
          return Promise.resolve(null);
        })
    ));
  }

  computeNetwork(peerStatuses){
    var networkHeight = 1;
    return peerStatuses
      .filter((body) => !!body)
      .map((body) => body.height);

  }

  acceptNewPeer(peer){
    if(this.peers[peer.ip]) return Promise.resolve();
    if(peer.nethash != this.config.network.nethash) return Promise.reject('Request is made on the wrong network');
    const npeer = new Peer(peer.ip, peer.port, this.config);
    return npeer.ping()
      .then(() => this.peers[peer.ip] = npeer)
      .catch((e) => logger.warn('Peer not connectable', npeer, e));
  }

  getPeers(){
    return Promise.resolve(Object.values(this.peers));
  }

  getRandomPeer(){
    const keys = Object.keys(this.peers);
    const random = keys[ keys.length * Math.random() << 0];
    const randomPeer = this.peers[random];
    if(!randomPeer) {
      logger.error(this.peers);
      delete this.peers[random];
      return this.getRandomPeer();
    }
    return randomPeer;
  }

  discoverPeers(){
    const that = this;
    return this.getRandomPeer().getPeers()
      .then((list)=>{
        list.forEach((peer)=>{
          if(peer.status == 'OK' && !that.peers[peer.ip]){
            that.peers[peer.ip] = new Peer(peer.ip, peer.port, that.config);
          }
        });
        return Promise.resolve(that.peers);
      })
      .catch(() => that.discoverPeers());
  }

  later(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
  }

  downloadBlocks(lastblock){
    const randomPeer = this.getRandomPeer();
    logger.info('Downloading blocks from', randomPeer.url, 'from block', lastblock.data.height);
    const that = this;
    return randomPeer
      .downloadBlocks(lastblock)
      .then((body) => Promise.resolve(body.blocks))
      .catch(() => that.downloadBlocks(lastblock));
  }
}

module.exports = Down;