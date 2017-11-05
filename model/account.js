var arkjs = require('arkjs');

class Account {
  constructor(address){
    this.address = address;
    this.publicKey = null;
    this.secondPublicKey = null;
    this.balance = 0;
    this.vote = null;
    this.username = null;
    this.multisignature = null;
  }

  toString(){
    return `${this.address}=${this.balance/10000000}`;
  }

  applyTransaction(transaction){
    if(transaction.recipientId == this.address){
      this.balance += transaction.amount;
    } else if(transaction.senderPublicKey == this.publicKey || arkjs.crypto.getAddress(transaction.senderPublicKey) == this.address){
      this.balance -= transaction.amount + transaction.fee;
    }
    switch(transaction.type){
    case 1:
      this.secondPublicKey = transaction.asset.signature;
      break;
    case 2:
      this.username = transaction.asset.username;
      break;
    case 3:
      if(transaction.asset.votes[0].startsWith('+'))
        this.vote = transaction.asset.votes[0].slice(1);
      else if(transaction.asset.votes[0].startsWith('-'))
        this.vote = this.previousVote;
      break;
    case 4:
      this.multisignature = transaction.asset.multisignature;
    }
  }

  undoTransaction(transaction){
    if(transaction.recipientId == this.address){
      this.balance -= transaction.amount;
    } else if(transaction.senderPublicKey == this.publicKey || arkjs.crypto.getAddress(transaction.senderPublicKey) == this.address){
      this.balance += transaction.amount + transaction.fee;
    }
    switch(transaction.type){
    case 1:
      this.secondPublicKey = null;
      break;
    case 2:
      this.username = null;
      break;
    case 3:
      if(transaction.asset.votes[0].startsWith('+'))
        this.vote = null;
      else if(transaction.asset.votes[0].startsWith('-'))
        this.vote = transaction.asset.votes[0].slice(1);
      break;
    case 4:
      this.multisignature = null;
    }
  }

  applyBlock(block){
    if(block.generatorPublicKey == this.publicKey || arkjs.crypto.getAddress(block.generatorPublicKey) == this.address){
      this.balance = block.reward + block.totalFee;
    }
  }

  canApply(transaction){
    let balanceOK = (transaction.recipientId == this.address) || (transaction.senderPublicKey == this.publicKey && this.balance - transaction.amount - transaction.fee > -1);
    if(!balanceOK) return false;
    switch(transaction.type){
    case 1:
      if(this.secondPublicKey) return false;
      break;
    case 2:
      if(this.username) return false;
      break;
    case 3:
      if(transaction.asset.votes[0].startsWith('+') && this.vote) return false;
      else if(transaction.asset.votes[0].startsWith('-') && !this.vote) return false;
      break;
    default:
      return false;
    }
    return true;
  }
}

module.exports = Account;