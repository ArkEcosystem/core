/**
 * The Arktoshi base.
 * @type {Number}
 */
export const ARKTOSHI = 1e8;

/**
 * Available transaction types.
 * @type {Object}
 */

export enum TransactionTypes {
    Transfer = 0,
    SecondSignature = 1,
    DelegateRegistration = 2,
    Vote = 3,
    MultiSignature = 4,
    Ipfs = 5,
    TimelockTransfer = 6,
    MultiPayment = 7,
    DelegateResignation = 8,
}
