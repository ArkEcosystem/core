class TransactionBuilder {
  /**
   * [delegateResignation description]
   * @return {[type]} [description]
   */
  delegateResignation () {
    return this.__getTransaction('delegate-resignation')
  }

  /**
   * [delegate description]
   * @return {[type]} [description]
   */
  delegate () {
    return this.__getTransaction('delegate')
  }

  /**
   * [ipfs description]
   * @return {[type]} [description]
   */
  ipfs () {
    return this.__getTransaction('ipfs')
  }

  /**
   * [multiPayment description]
   * @return {[type]} [description]
   */
  multiPayment () {
    return this.__getTransaction('multi-payment')
  }

  /**
   * [multiSignature description]
   * @return {[type]} [description]
   */
  multiSignature () {
    return this.__getTransaction('multi-signature')
  }

  /**
   * [secondSignature description]
   * @return {[type]} [description]
   */
  secondSignature () {
    return this.__getTransaction('second-signature')
  }

  /**
   * [timelockTransfer description]
   * @return {[type]} [description]
   */
  timelockTransfer () {
    return this.__getTransaction('timelock-transfer')
  }

  /**
   * [transfer description]
   * @return {[type]} [description]
   */
  transfer () {
    return this.__getTransaction('transfer')
  }

  /**
   * [vote description]
   * @return {[type]} [description]
   */
  vote () {
    return this.__getTransaction('vote')
  }

  /**
   * [getTransaction description]
   * @param  {String} transactionType [description]
   * @return {Transaction}            [description]
   */
  __getTransaction (transactionType) {
    return new (require(`./transactions/${transactionType}`).default)() // eslint-disable-line new-cap
  }
}

export default new TransactionBuilder()
