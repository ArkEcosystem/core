const async = require('async');

class TransactionPool {
  contructor(config){
    this.config = config;


    this.queue = async.queue((transaction, qcallback) => {

      qcallback();
    }, this.config.server.multicore.transactionpool || 1);
  }

  
}

module.exports = TransactionPool;