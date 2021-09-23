import { Utils } from "@arkecosystem/crypto";
export declare class Signer {
    protected network: number;
    protected nonce: Utils.BigNumber;
    constructor(network: number, nonce: string);
    makeTransfer(opts: Record<string, any>): any;
    makeDelegate(opts: Record<string, any>): any;
    makeSecondSignature(opts: Record<string, any>): any;
    makeVote(opts: Record<string, any>): any;
    makeMultiSignatureRegistration(opts: Record<string, any>): any;
    makeIpfs(opts: Record<string, any>): any;
    makeMultipayment(opts: Record<string, any>): any;
    makeHtlcLock(opts: Record<string, any>): any;
    makeHtlcClaim(opts: Record<string, any>): any;
    makeHtlcRefund(opts: Record<string, any>): any;
    private incrementNonce;
    private toSatoshi;
}
