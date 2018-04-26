class TransactionBuilder {
  /**
   * Create new delegate resignation transaction type.
   * @return {DelegateResignation}
   */
  delegateResignation () {
    return this.__getTransaction('delegate-resignation')
  }

  /**
   * Create new delegate transaction type.
   * @return {Delegate}
   */
  delegate () {
    return this.__getTransaction('delegate')
  }

  /**
   * Create new IPFS transaction type.
   * @return {IPFS}
   */
  ipfs () {
    return this.__getTransaction('ipfs')
  }

  /**
   * Create new multi-payment transaction type.
   * @return {MultiPayment}
   */
  multiPayment () {
    return this.__getTransaction('multi-payment')
  }

  /**
   * Create new multi-signature transaction type.
   * @return {MultiSignature}
   */
  multiSignature () {
    return this.__getTransaction('multi-signature')
  }

  /**
   * Create new second signature transaction type.
   * @return {SecondSignature}
   */
  secondSignature () {
    return this.__getTransaction('second-signature')
  }

  /**
   * Create new timelock transfer transaction type.
   * @return {TimelockTransfer}
   */
  timelockTransfer () {
    return this.__getTransaction('timelock-transfer')
  }

  /**
   * Create new transfer transaction type.
   * @return {Transfer}
   */
  transfer () {
    return this.__getTransaction('transfer')
  }

  /**
   * Create new vote transaction type.
   * @return {Vote}
   */
  vote () {
    return this.__getTransaction('vote')
  }

  /**
   * Create new instance of specified transaction type.
   * @param  {String} transactionType
   * @return {Transaction}
   */
  __getTransaction (transactionType) {
    return new (require(`./transactions/${transactionType}`))() // eslint-disable-line new-cap
  }
}

module.exports = new TransactionBuilder()
