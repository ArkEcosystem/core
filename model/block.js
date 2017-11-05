const arkjs = require('arkjs');
var crypto = require('crypto');
var bignum = require('bignum');
var ByteBuffer = require('bytebuffer');
var Transaction = require('./transaction');

class Block {
  constructor(data) {
    this.data = data;
    this.data.totalAmount = parseInt(this.data.totalAmount);
    this.data.totalFee = parseInt(this.data.totalFee);
    this.data.reward = parseInt(this.data.reward);
    this.genesis = data.height == 1;
    this.transactions = data.transactions.map((tx)=>{
      let txx = new Transaction(tx);
      txx.blockId = data.id;
      return txx;
    });
    this.verification = this.verify();
  }

  toString() {
    return `${this.data.id}, height: ${this.data.height}, ${this.data.transactions.length} transactions, verified: ${this.verification.verified}, errors:${this.verification.errors}`;
  }

  getHeader() {
    const header = Object.assign({}, this.data);
    delete header.transactions;
    return header;
  }

  verifySignature() {
    var bytes = this.serialize(false);
    var hash = crypto.createHash('sha256').update(bytes).digest();
    var blockSignatureBuffer = new Buffer(this.data.blockSignature, 'hex');
    var generatorPublicKeyBuffer = new Buffer(this.data.generatorPublicKey, 'hex');
    var ecpair = arkjs.ECPair.fromPublicKeyBuffer(generatorPublicKeyBuffer);
    var ecsignature = arkjs.ECSignature.fromDER(blockSignatureBuffer);
    var res = ecpair.verify(hash, ecsignature);

    return res;
  }

  process() {
    return Promise.resolve();
  }

  verify() {
    var block = this.data;
    var result = {
      verified: false,
      errors: []
    };

    // var previousBlock = null;

    if (block.height !== 1) {
      if (!block.previousBlock) {
        result.errors.push('Invalid previous block');
      }
    }

    var expectedReward = 200000000;

    // if (block.height !== 1 && expectedReward !== block.reward) {
    //   result.errors.push(['Invalid block reward:', block.reward, 'expected:', expectedReward].join(' '));
    // }

    var valid = this.verifySignature(block);

    if (!valid) {
      result.errors.push('Failed to verify block signature');
    }

    if (block.version > 0) {
      result.errors.push('Invalid block version');
    }

    // var blockSlotNumber = slots.getSlotNumber(block.timestamp);

    // if (blockSlotNumber > slots.getSlotNumber()){
    //   result.errors.push('Invalid block timestamp');
    // }

    // Disabling to allow orphanedBlocks?
    // if(previousBlock){
    //   var lastBlockSlotNumber = slots.getSlotNumber(previousBlock.timestamp);
    //   if(blockSlotNumber < lastBlockSlotNumber) {
    //      result.errors.push('block timestamp is smaller than previous block timestamp');
    //   }
    // }

    // if (block.payloadLength > constants.maxPayloadLength) {
    //   result.errors.push('Payload length is too high');
    // }

    if (block.transactions.length !== block.numberOfTransactions) {
      result.errors.push('Invalid number of transactions');
    }

    // if (block.transactions.length > constants.maxTxsPerBlock) {
    //   result.errors.push('Transactions length is too high');
    // }

    // Checking if transactions of the block adds up to block values.
    var totalAmount = 0,
      totalFee = 0,
      size = 0,
      payloadHash = crypto.createHash('sha256'),
      appliedTransactions = {};

    var transactions = block.transactions;

    for (var i in transactions) {
      var transaction = transactions[i];

      if (!transaction.id) {
        transaction.id = arkjs.crypto.getId(transaction);
      }

      var bytes = new Buffer(transaction.id, 'hex');

      // if (size + bytes.length > constants.maxPayloadLength) {
      //   result.errors.push('Payload is too large');
      // }

      size += bytes.length;

      if (appliedTransactions[transaction.id]) {
        result.errors.push('Encountered duplicate transaction: ' + transaction.id);
      }

      appliedTransactions[transaction.id] = transaction;

      payloadHash.update(bytes);

      totalAmount += transaction.amount;

      totalFee += transaction.fee;
    }



    var calculatedHash = payloadHash.digest().toString('hex');
    if (!this.genesis && calculatedHash !== block.payloadHash) {
      result.errors.push('Invalid payload hash');
    }

    if (totalAmount !== block.totalAmount) {
      result.errors.push('Invalid total amount');
    }

    if (totalFee !== block.totalFee) {
      result.errors.push('Invalid total fee');
    }

    result.verified = result.errors.length === 0;
    return result;
  }

  serialize(includeSignature) {
    let block = this.data;
    if (includeSignature == undefined) {
      includeSignature = block.blockSignature != undefined;
    }
    var size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 33;
    var blockSignatureBuffer = null;

    if (includeSignature) {
      blockSignatureBuffer = new Buffer(block.blockSignature, 'hex');
      size += blockSignatureBuffer.length;
    }
    var b, i;

    try {
      var bb = new ByteBuffer(size, true);
      bb.writeInt(block.version);
      bb.writeInt(block.timestamp);
      bb.writeInt(block.height);

      if (block.previousBlock) {
        var pb = bignum(block.previousBlock).toBuffer({
          size: '8'
        });

        for (i = 0; i < 8; i++) {
          bb.writeByte(pb[i]);
        }
      } else {
        for (i = 0; i < 8; i++) {
          bb.writeByte(0);
        }
      }

      bb.writeInt(block.numberOfTransactions);
      bb.writeLong(block.totalAmount);
      bb.writeLong(block.totalFee);
      bb.writeLong(block.reward);

      bb.writeInt(block.payloadLength);

      var payloadHashBuffer = new Buffer(block.payloadHash, 'hex');
      for (i = 0; i < payloadHashBuffer.length; i++) {
        bb.writeByte(payloadHashBuffer[i]);
      }

      var generatorPublicKeyBuffer = new Buffer(block.generatorPublicKey, 'hex');
      for (i = 0; i < generatorPublicKeyBuffer.length; i++) {
        bb.writeByte(generatorPublicKeyBuffer[i]);
      }

      if (includeSignature) {
        for (i = 0; i < blockSignatureBuffer.length; i++) {
          bb.writeByte(blockSignatureBuffer[i]);
        }
      }

      bb.flip();
      b = bb.toBuffer();
    } catch (e) {
      throw e;
    }

    return b;
  }
}

module.exports = Block;