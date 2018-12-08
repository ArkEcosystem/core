export class TransactionBuilderDirector {
  /**
   * Create new delegate resignation transaction type.
   * @return {DelegateResignationBuilder}
   */
  public delegateResignation() {
    return this.__getTransaction("delegate-resignation");
  }

  /**
   * Create new delegate transaction type.
   * @return {DelegateRegistrationBuilder}
   */
  public delegateRegistration() {
    return this.__getTransaction("delegate-registration");
  }

  /**
   * Create new IPFS transaction type.
   * @return {IPFSBuilder}
   */
  public ipfs() {
    return this.__getTransaction("ipfs");
  }

  /**
   * Create new multi-payment transaction type.
   * @return {MultiPaymentBuilder}
   */
  public multiPayment() {
    return this.__getTransaction("multi-payment");
  }

  /**
   * Create new multi-signature transaction type.
   * @return {MultiSignatureBuilder}
   */
  public multiSignature() {
    return this.__getTransaction("multi-signature");
  }

  /**
   * Create new second signature transaction type.
   * @return {SecondSignatureBuilder}
   */
  public secondSignature() {
    return this.__getTransaction("second-signature");
  }

  /**
   * Create new timelock transfer transaction type.
   * @return {TimelockTransferBuilder}
   */
  public timelockTransfer() {
    return this.__getTransaction("timelock-transfer");
  }

  /**
   * Create new transfer transaction type.
   * @return {TransferBuilder}
   */
  public transfer() {
    return this.__getTransaction("transfer");
  }

  /**
   * Create new vote transaction type.
   * @return {VoteBuilder}
   */
  public vote() {
    return this.__getTransaction("vote");
  }

  /**
   * Create new instance of specified transaction type.
   * @param  {String} transactionType
   * @return {TransactionBuilder}
   */
  public __getTransaction(transactionType) {
    return new (require(`./transactions/${transactionType}`))();
  }
}

export default new TransactionBuilderDirector();
