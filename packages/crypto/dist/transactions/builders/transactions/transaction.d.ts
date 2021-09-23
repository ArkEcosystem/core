import { ITransaction, ITransactionData } from "../../../interfaces";
export declare abstract class TransactionBuilder<TBuilder extends TransactionBuilder<TBuilder>> {
    data: ITransactionData;
    protected signWithSenderAsRecipient: boolean;
    constructor();
    build(data?: Partial<ITransactionData>): ITransaction;
    version(version: number): TBuilder;
    typeGroup(typeGroup: number): TBuilder;
    nonce(nonce: string): TBuilder;
    network(network: number): TBuilder;
    fee(fee: string): TBuilder;
    amount(amount: string): TBuilder;
    recipientId(recipientId: string): TBuilder;
    senderPublicKey(publicKey: string): TBuilder;
    vendorField(vendorField: string): TBuilder;
    sign(passphrase: string): TBuilder;
    signWithWif(wif: string, networkWif?: number): TBuilder;
    secondSign(secondPassphrase: string): TBuilder;
    secondSignWithWif(wif: string, networkWif?: number): TBuilder;
    multiSign(passphrase: string, index: number): TBuilder;
    multiSignWithWif(index: number, wif: string, networkWif?: number): TBuilder;
    verify(): boolean;
    getStruct(): ITransactionData;
    protected abstract instance(): TBuilder;
    private signWithKeyPair;
    private secondSignWithKeyPair;
    private multiSignWithKeyPair;
    private getSigningObject;
}
