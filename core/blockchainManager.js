const async = require('async');
const Block = require('../model/block');
const db = require('./db'); 
const logger = require('./logger');

let instance = null;

class BlockchainManager {

  constructor(config) {
    if(!instance) instance = this;
    else throw new Error('Can\'t initialise 2 blockchains!');
    this.config = config;
    this.monitoring = false;
    this.lastBlock = null;
    this.blockQueue = async.queue((block, qcallback) => {
      this.processBlock.call(this, new Block(block), qcallback);
    }, 1);
    this.blockQueue.drain = () => this.syncWithNetwork();

    if(!instance) instance = this;
  }

  static getInstance(){
    return instance;
  }

  finishedNetworkSync(){
    return db
      .buildAccounts()
      .then(() => db.buildDelegates())
      .then(() => this.startNetworkMonitoring());
  }

  startNetworkMonitoring(){
    if(this.monitoring) return;
    this.monitoring = true;
    return this.updateBlockchainFromNetwork();
  }

  updateBlockchainFromNetwork(){
    if(!this.monitoring) return Promise.reject('stopped by user');
    else return this.networkInterface.updateNetworkStatus()
      .then(() => this.syncWithNetwork())
      .then(() => new Promise(resolve => setTimeout(resolve, 60000)))
      .then(() => this.updateBlockchainFromNetwork());
  }

  stopNetworkMonitoring(){
    this.monitoring = false;
  }

  init(){
    const that = this;
    return db.getLastBlock()
      .then((block)=>{
        if(!block){
          return Promise.reject('No Block Found');
        }
        that.lastBlock = block;
        return Promise.resolve(block);
      })
      .catch((error)=>{
        let genesis = new Block(that.config.genesisBlock);
        if(genesis.data.payloadHash == that.config.network.nethash){
          that.lastBlock = genesis;
          return db.saveBlock(genesis);
        }
        return Promise.reject('Can\'t use genesis block', genesis);
      });
  }

  processBlock(block, qcallback){
    if(block.verification.verified){
      if(block.data.previousBlock == this.lastBlock.data.id){
        const that=this;
        block.process().then(()=>{
          db.saveBlock(block);
          logger.debug('Added new block at height', block.data.height);
          that.lastBlock = block;
          qcallback();
        });
      }
    }
  }

  syncWithNetwork(){
    const that = this;
    if(this.networkInterface) this.networkInterface.downloadBlocks(this.lastBlock).then((blocks)=>{
      logger.info('Downloaded new blocks', blocks.length, 'with', blocks.reduce((sum, b) => sum+b.numberOfTransactions, 0), 'transactions');
      if(blocks.length) that.blockQueue.push(blocks);
      else that.finishedNetworkSync();
    });
  }

  attachNetworkInterface(networkInterface){
    this.networkInterface = networkInterface;
    return this;
  }

  sleep(ms){
    return new Promise((resolve)=>{
      setTimeout(resolve,ms);
    });
  }
}

module.exports = BlockchainManager;