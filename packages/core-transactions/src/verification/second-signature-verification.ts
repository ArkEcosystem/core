import { Container, Contracts, Exceptions } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

@Container.injectable()
export class SecondSignatureVerification implements Contracts.Transactions.SecondSignatureVerification {
    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        return Transactions.Verifier.verifySecondSignature(transaction, publicKey);
    }

    public clear(transactionId: string): void {
        throw new Exceptions.Runtime.NotImplemented(this.constructor.name, "clear");
    }
}
