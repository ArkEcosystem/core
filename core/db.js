const Sequelize = require('sequelize');
const arkjs = require('arkjs');
const Block = require('../model/block');
const Transaction = require('../model/transaction');
const Account = require('../model/account');
const config = require('./config');
const logger = require('./logger');

let instance;

class DB {

  constructor() {
    if(!instance){
      instance = this;
    }
    return instance;
    
  }

  init(params) {
    if (this.db) {
      return Promise.reject('Already initialised');
    }
    this.db = new Sequelize(params.uri,{
      dialect:'sqlite',
      logging: false
    });
    return this.db
      .authenticate()
      .then(() => {
        this.blocks = this.db.define('blocks', {
          id: {
            type: Sequelize.STRING(64),
            primaryKey: true
          },
          version: Sequelize.SMALLINT,
          timestamp: Sequelize.INTEGER,
          previousBlock: Sequelize.STRING(64),
          height: Sequelize.INTEGER,
          numberOfTransactions: Sequelize.INTEGER,
          totalAmount: Sequelize.BIGINT,
          totalFee: Sequelize.BIGINT,
          reward: Sequelize.BIGINT,
          payloadLength: Sequelize.INTEGER,
          payloadHash: Sequelize.STRING(64),
          generatorPublicKey: Sequelize.STRING(66),
          blockSignature: Sequelize.STRING(128)
        }, {
          indexes: [
            {
              unique: true,
              fields: ['id']
            },
            {
              unique: true,
              fields: ['height']
            },
            {
              fields: ['generatorPublicKey']
            }
          ]
        });
        this.transactions = this.db.define('transactions', {
          id: {
            type: Sequelize.STRING(64),
            primaryKey: true
          },
          version: Sequelize.SMALLINT,
          blockId: {
            type: Sequelize.STRING(64),
            references: {
              model: this.blocks,
              key: 'id',
            }
          },
          timestamp: Sequelize.INTEGER,
          senderPublicKey: Sequelize.STRING(66),
          recipientId: Sequelize.STRING(36),
          type: Sequelize.SMALLINT,
          vendorFieldHex: Sequelize.BLOB,
          amount: Sequelize.BIGINT,
          fee: Sequelize.BIGINT,
          serialized: Sequelize.BLOB
        }, {
          indexes: [
            {
              unique: true,
              fields: ['id']
            },
            {
              fields: ['senderPublicKey']
            },
            {
              fields: ['recipientId']
            },
            {
              fields: ['vendorFieldHex']
            }

          ]
        });
        this.transactions.belongsTo(this.blocks);
        this.blocks.hasMany(this.transactions);
        this.accounts = this.db.define('accounts', {
          address: {
            type: Sequelize.STRING(36),
            primaryKey: true
          },
          publicKey: Sequelize.STRING(66),
          secondPublicKey: Sequelize.STRING(66),
          vote: Sequelize.STRING(66),
          username: Sequelize.STRING(64),
          balance: Sequelize.BIGINT,
        }, {
          indexes: [
            {
              unique: true,
              fields: ['Address']
            },
            { 
              unique: true,
              fields: ['publicKey']
            },
            {
              fields: ['vote']
            },
            {
              fields: ['username']
            }

          ]
        });
        return Promise.all([
          this.blocks.sync(),
          this.transactions.sync(),
          this.accounts.sync({force: true})
        ]);
      });
  }

  buildDelegates(){
    logger.info('building delegate list');
    return this.accounts
      .findAll({
        attributes:[
          'vote',
          [Sequelize.fn('SUM', Sequelize.col('balance')), 'balance']
        ],
        group: 'vote',
        where :{
          vote: {
            [Sequelize.Op.ne]: null
          }
        }
      })
      .then((data) => {
        logger.info(`got ${data.length} voted delegates`);
        let activedelegates = data
          .sort((a, b) => b.balance - a.balance)
          .slice(0,51);
        logger.info(`generated ${activedelegates.length} active delegates`);
        return Promise.resolve();
      });
  }

  buildAccounts(){
    this.localaccounts = {};
    return this.transactions
      .findAll({
        attributes:[
          'recipientId',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
        ],
        group: 'recipientId'
      })
      .then((data)=>{
        data.forEach((row)=>{
          const account = new Account(row.recipientId);
          account.balance = row.amount;
          this.localaccounts[row.recipientId] = account;
        });
        return this.blocks.findAll({
          attributes:[
            'generatorPublicKey',
            [Sequelize.fn('SUM', Sequelize.col('reward')), 'reward'],
            [Sequelize.fn('SUM', Sequelize.col('totalFee')), 'totalFee']
          ],
          group: 'generatorPublicKey'}
        );
      }).then((data)=>{
        data.forEach((row)=>{
          let account = this.localaccounts[arkjs.crypto.getAddress(row.generatorPublicKey, config.network.pubKeyHash)];
          if(account){
            account.balance += row.reward + row.totalFee;
          }
          else {
            account = new Account(arkjs.crypto.getAddress(row.generatorPublicKey, config.network.pubKeyHash));
            account.publicKey = row.generatorPublicKey;
            account.balance = row.reward + row.totalFee;
            this.localaccounts[account.address] = account;
          }
        });
        return this.transactions.findAll({
          attributes:[
            'senderPublicKey',
            [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'],
            [Sequelize.fn('SUM', Sequelize.col('fee')), 'fee']
          ],
          group: 'senderPublicKey'}
        );
      })
      .then((data)=>{
        data.forEach((row)=>{
          let account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)];
          if(account){
            account.publicKey = row.senderPublicKey;
            account.balance -= row.amount + row.fee;
          }
          else {
            account = new Account(arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash));
            account.publicKey = row.senderPublicKey;
            account.balance = -row.amount - row.fee;
            this.localaccounts[account.address] = account;
            logger.error(account.address, row.amount, row.fee);
          }
        });
        logger.info('SPV rebuild finished', Object.keys(this.localaccounts).length);
        return this.transactions.findAll({
          attributes:[
            'senderPublicKey',
            'serialized'
          ],
          where: {type:1}}
        );
      }).then((data)=>{
        data.forEach((row)=>{
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)];
          account.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey;
        });
        return this.transactions.findAll({
          attributes:[
            'senderPublicKey',
            'serialized'
          ],
          where: {type:2}}
        );
      }).then((data)=>{
        data.forEach((row)=>{
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)];
          account.username = Transaction.deserialize(row.serialized.toString('hex')).asset.delegate.username;
        });
        Object.keys(this.localaccounts)
          .filter((a) => this.localaccounts[a].balance < 0)
          .forEach((a) => logger.info(this.localaccounts[a]));
        return this.transactions.findAll({
          attributes:[
            'senderPublicKey',
            'serialized'
          ],
          order: [[ 'createdAt', 'DESC' ]],
          where: {type:3}}
        );
      }).then((data) => {
        data.forEach((row)=>{
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)];
          if(!account.voted){
            let vote = Transaction.deserialize(row.serialized.toString('hex')).asset.votes[0];
            if(vote.startsWith('+')) account.vote = vote.slice(1);
            account.voted = true;
          }
        });
        return this.accounts.bulkCreate(Object.values(this.localaccounts) || []);
      })
      .catch((error) => logger.error(error));
  }

  saveBlock(block) {
    return this.blocks
      .create(block.data)
      .then(() => this.transactions.bulkCreate(block.transactions || [])); 
  }

  getBlock(id) {
    return this.blocks
      .findOne({id:id})
      .then((data) => Promise.resolve(new Block(data)));
  }

  getBlocks(offset, limit) {
    const last = offset+limit;
    return this.blocks
      .findAll({
        include: [{
          model: this.transactions,
          attributes:  ['serialized']
        }],
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        where: {
          height: {
            [Sequelize.Op.between]: [offset, last]
          }
        }
      })
      .then((blocks) => {
        const nblocks = blocks.map((block) => {
          block.dataValues.transactions = block.dataValues.transactions.map((tx) => {
            return tx.serialized.toString('hex');
          });
          return block.dataValues;
        });
        return Promise.resolve(nblocks); 
      });
  }

  getLastBlock() {
    return this.blocks
      .findOne({order:[['height', 'DESC']]})
      .then((data) => {
        if(data)
          return Promise.resolve(data);
        else
          return Promise.reject('No block found in database');
      })
      .then((block) =>
        this.transactions
          .findAll({where :{blockId: block.id}})
          .then((data) => {
            block.transactions = data.map((tx) => Transaction.deserialize(tx.serialized.toString('hex')));
            return Promise.resolve(new Block(block));
          })
      );
  }
}

module.exports = new DB();