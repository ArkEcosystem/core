/**
 * The Satoshi base.
 */
export const SATOSHI: number = 1e8;

/**
 * Alias of SATOSHI.
 */
export const ARKTOSHI: number = SATOSHI;

/**
 * Available transaction types.
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
