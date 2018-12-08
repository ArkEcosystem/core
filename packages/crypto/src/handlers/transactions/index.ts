import { TRANSACTION_TYPES } from "../../constants"

export class TransactionHandler {
  public handlers: { [x: number]: any; };
  /**
   * [constructor description]
   */
  constructor() {
    this.handlers = {
      [TRANSACTION_TYPES.TRANSFER]: require("./transfer"),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: require("./second-signature"),
      [TRANSACTION_TYPES.DELEGATE_REGISTRATION]: require("./delegate-registration"),
      [TRANSACTION_TYPES.VOTE]: require("./vote"),
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: require("./multi-signature"),
      [TRANSACTION_TYPES.IPFS]: require("./ipfs"),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: require("./timelock-transfer"),
      [TRANSACTION_TYPES.MULTI_PAYMENT]: require("./multi-payment"),
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: require("./delegate-resignation")
    };
  }

  /**
   * [canApply description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @param {Array} errors
   * @return {Boolean}
   */
  public canApply(wallet, transaction, errors) {
    return this.handlers[transaction.type].canApply(
      wallet,
      transaction,
      errors
    );
  }

  /**
   * [apply description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public apply(wallet, transaction) {
    return this.handlers[transaction.type].apply(wallet, transaction);
  }

  /**
   * [applyTransactionToSender description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public applyTransactionToSender(wallet, transaction) {
    return this.handlers[transaction.type].applyTransactionToSender(
      wallet,
      transaction
    );
  }

  /**
   * [applyTransactionToRecipient description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public applyTransactionToRecipient(wallet, transaction) {
    return this.handlers[transaction.type].applyTransactionToRecipient(
      wallet,
      transaction
    );
  }

  /**
   * [revert description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public revert(wallet, transaction) {
    return this.handlers[transaction.type].revert(wallet, transaction);
  }

  /**
   * [revertTransactionForSender description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public revertTransactionForSender(wallet, transaction) {
    return this.handlers[transaction.type].revertTransactionForSender(
      wallet,
      transaction
    );
  }

  /**
   * [revertTransactionForRecipient description]
   * @param  {Wallet} wallet
   * @param  {Transaction} transaction
   * @return {void}
   */
  public revertTransactionForRecipient(wallet, transaction) {
    return this.handlers[transaction.type].revertTransactionForRecipient(
      wallet,
      transaction
    );
  }
}

export default new TransactionHandler();
