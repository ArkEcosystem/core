let instance = null;

class Config {
  constructor() {
    if(!instance){
      instance = this;
    }
    return instance; 
  }

  init(config){
    this.server = config.server;
    this.network = config.network;
    this.genesisBlock = config.genesisBlock;
  }
}

module.exports = new Config();