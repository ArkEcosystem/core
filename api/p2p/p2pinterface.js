var Down = require('./down');
var Up = require('./up');

class P2PInterface {
  constructor(config){
    this.down = new Down(config);
    this.up = new Up(config);
  }

  warmup(){
    return Promise.all([
      this.down.start(this),
      this.up.start(this)
    ]);
  }

  tearDown(){
    this.down.stop();
    this.up.stop();
  }

  updateNetworkStatus(){
    return this.down.updateNetworkStatus();
  }

  downloadBlocks(lastblock){
    return this.down.downloadBlocks(lastblock);
  }

  acceptNewPeer(peer){
    return this.down.acceptNewPeer(peer);
  }

  getPeers(){
    return this.down.getPeers();
  }

  getNetworkHeight(){
    return this.down.getNetworkHeight();
  }

}

module.exports = P2PInterface;
