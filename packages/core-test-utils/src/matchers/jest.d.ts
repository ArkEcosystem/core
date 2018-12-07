// tslint:disable-next-line:no-namespace
declare namespace jest {
  // tslint:disable-next-line:interface-name
  interface Matchers<R> {
    toBeValidBlock(): R; // TODO list all matchers
    toBeValidArrayOfBlocks(): R;

    toBeValidPeer(): R;
    toBeValidArrayOfPeers(): R;

    toBeSuccessfulResponse(): R;
    toBePaginated(): R;

    toBeApiTransaction(): R;

    toDispatch(dispatcher: object, value: string): R;

    toExecuteOnEntry(transition: object): R;

    toTransition(transition: object): R;

    toBeArkAddress(): R;

    toBeArkPublicKey(): R;

    toBeDelegate(): R;

    toBeTransaction(): R;

    toBeWallet(): R;

    toBeDelegateResignationType(): R;

    toBeDelegateType(): R;

    toBeIpfsType(): R;

    toBeMultiPaymentType(): R;

    toBeMultiSignatureType(): R;

    toBeSecondSignatureType(): R;

    toBeTimelockTransferType(): R;

    toBeTransferType(): R;

    toBeVoteType(): R;

    toHaveValidSecondSignature(value: object): R;

    toBeValidTransaction(): R;
  }
}
