const async = require('async');
const Block = require('../model/block');
const db = require('./db');
const logger = require('./logger');

let instance = null;

class BlockchainManager {

  constructor(config) {
    if (!instance) instance = this;
    else throw new Error('Can\'t initialise 2 blockchains!');
    this.config = config;
    this.monitoring = false;
    this.fastRebuild = true;
    this.lastBlock = null;
    this.processQueue = async.queue((block, qcallback) => this.processBlock(new Block(block), this.fastRebuild, qcallback), 1);
    const that = this;
    this.downloadQueue =  async.queue((block, qcallback) => {
      that.lastPushedBlock = block;
      that.processQueue.push(block);
      qcallback();
    },
    1);
    this.downloadQueue.drain = () => {
      logger.info('Block Process Queue Size', that.processQueue.length());
      this.syncWithNetwork({data:this.lastPushedBlock});
    };
    //this.processQueue.drain = () => this.finishedNetworkSync();

    if (!instance) instance = this;
  }

  static getInstance() {
    return instance;
  }

  finishedNetworkSync() {
    const that = this;
    return this.networkInterface
      .getNetworkHeight()
      .then((height) => {
        if(height - 500 > that.lastBlock.data.height) return that.syncWithNetwork(that.lastBlock);
        else if(that.fastRebuild){
          logger.info('Block Process Queue is empty. Rebuild is finished.');
          that.fastRebuild = false;
          return db.saveAccounts(true)
            .then(() => db.buildAccounts())
            .then((accounts) => logger.info('Built SPV accounts', accounts.length))
            .then(() => that.syncWithNetwork(that.lastBlock));
        }
        else return this.startNetworkMonitoring();
      });
  }

  startNetworkMonitoring() {
    if (this.monitoring) return;
    this.monitoring = true;
    return this.updateBlockchainFromNetwork();
  }

  updateBlockchainFromNetwork() {
    if (!this.monitoring) return Promise.reject('stopped by user');

    return this.networkInterface.updateNetworkStatus()
      .then(() => this.syncWithNetwork(this.lastBlock))
      .then(() => new Promise(resolve => setTimeout(resolve, 60000)))
      .then(() => this.updateBlockchainFromNetwork());
  }

  stopNetworkMonitoring() {
    this.monitoring = false;
  }

  init() {
    const that = this;
    return db.getLastBlock()
      .then((block) => {
        if (!block) {
          return Promise.reject('No block found in database');
        }
        that.lastBlock = block;
        return Promise.resolve(block);
      })
      .catch((error) => {
        let genesis = new Block(that.config.genesisBlock);
        if (genesis.data.payloadHash == that.config.network.nethash) {
          that.lastBlock = genesis;
          return db.saveBlock(genesis);
        }
        return Promise.reject('Can\'t use genesis block', genesis);
      });
  }

  processBlock(block, fastRebuild, qcallback) {
    if (block.verification.verified) {
      if (block.data.previousBlock == this.lastBlock.data.id) {
        const that = this;
        db.applyBlock(block, fastRebuild)
          .then(() => {
            db.saveBlock(block);
            logger.debug('Added new block at height', block.data.height);
            that.lastBlock = block;
            qcallback();
          })
          .catch((error) => {
            logger.error(error);
            logger.debug('Refused new block', block.data);
            qcallback();
          });
      } else if (block.data.height > this.lastBlock.data.height + 1) {
        // requeue it (was not received in right order)
        this.processQueue.push(block.data);
        qcallback();
      }
    }
  }

  syncWithNetwork(block) {
    block = block || this.lastBlock;
    const that = this;
    if(this.networkInterface)
      return this.networkInterface.downloadBlocks(block).then((blocks) => {
        if(!blocks) return that.syncWithNetwork(block);
        else {
          logger.info('Downloaded new blocks', blocks.length, 'with', blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0), 'transactions');
          if(blocks.length && blocks[0].previousBlock == block.data.id) that.downloadQueue.push(blocks);
          return Promise.resolve(blocks.length);
        }
      });
    else return Promise.reject('No network interface attached');
  }

  attachNetworkInterface(networkInterface) {
    this.networkInterface = networkInterface;
    return this;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = BlockchainManager;