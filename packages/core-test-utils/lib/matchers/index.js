module.exports = {
  toBeArkAddress: require('./fields/address'),
  toBeArkPublicKey: require('./fields/public-key'),

  toBeApiTransaction: require('./api/transaction'),

  toBeDelegate: require('./models/delegate'),
  toBeTransaction: require('./models/transaction'),
  toBeWallet: require('./models/wallet'),

  toBeValidTransaction: require('./transactions/valid'),
  toHaveValidSecondSignature: require('./transactions/valid-second-signature'),

  toBeDelegateResignationType: require('./transactions/types/delegate-resignation'),
  toBeDelegateType: require('./transactions/types/delegate'),
  toBeIpfsType: require('./transactions/types/ipfs'),
  toBeMultiPaymentType: require('./transactions/types/multi-payment'),
  toBeMultiSignatureType: require('./transactions/types/multi-signature'),
  toBeSecondSignatureType: require('./transactions/types/second-signature'),
  toBeTimelockTransferType: require('./transactions/types/timelock-transfer'),
  toBeTransferType: require('./transactions/types/transfer'),
  toBeVoteType: require('./transactions/types/vote'),

  toDispatch: require('./blockchain/dispatch')
}
