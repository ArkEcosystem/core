class TransactionBuilderDirector {
  /**
   * Create new delegate resignation transaction type.
   * @return {DelegateResignationBuilder}
   */
  delegateResignation() {
    return this.__getTransaction('delegate-resignation')
  }

  /**
   * Create new delegate transaction type.
   * @return {DelegateRegistrationBuilder}
   */
  delegateRegistration() {
    return this.__getTransaction('delegate-registration')
  }

  /**
   * Create new IPFS transaction type.
   * @return {IPFSBuilder}
   */
  ipfs() {
    return this.__getTransaction('ipfs')
  }

  /**
   * Create new multi-payment transaction type.
   * @return {MultiPaymentBuilder}
   */
  multiPayment() {
    return this.__getTransaction('multi-payment')
  }

  /**
   * Create new multi-signature transaction type.
   * @return {MultiSignatureBuilder}
   */
  multiSignature() {
    return this.__getTransaction('multi-signature')
  }

  /**
   * Create new second signature transaction type.
   * @return {SecondSignatureBuilder}
   */
  secondSignature() {
    return this.__getTransaction('second-signature')
  }

  /**
   * Create new timelock transfer transaction type.
   * @return {TimelockTransferBuilder}
   */
  timelockTransfer() {
    return this.__getTransaction('timelock-transfer')
  }

  /**
   * Create new transfer transaction type.
   * @return {TransferBuilder}
   */
  transfer() {
    return this.__getTransaction('transfer')
  }

  /**
   * Create new vote transaction type.
   * @return {VoteBuilder}
   */
  vote() {
    return this.__getTransaction('vote')
  }

  /**
   * Create new instance of specified transaction type.
   * @param  {String} transactionType
   * @return {TransactionBuilder}
   */
  __getTransaction(transactionType) {
    return new (require(`./transactions/${transactionType}`))() // eslint-disable-line new-cap
  }
}

module.exports = new TransactionBuilderDirector()
