import { CryptoManager, Transactions } from "../../../../../packages/crypto/src";

export class CryptoSuite {
    public TransactionManager: Transactions.TransactionManager<any>;
    public CryptoManager: CryptoManager<any>;

    public constructor(config = CryptoManager.findNetworkByName("testnet"), validator = {}) {
        this.CryptoManager = CryptoManager.createFromConfig(config);
        this.TransactionManager = new Transactions.TransactionManager(this.CryptoManager, validator as any);
    }
}
