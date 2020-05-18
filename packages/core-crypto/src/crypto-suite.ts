import * as Crypto from "@arkecosystem/crypto";

import { BlockFactory } from "./blocks";
import { IBlockData } from "./interfaces";
import { Validator } from "./validation";

export class TransactionTools extends Crypto.Transactions.TransactionTools<IBlockData> {}

export class TransactionManager extends Crypto.Transactions.TransactionManager<IBlockData> {}

export class CryptoManager extends Crypto.CryptoManager<IBlockData> {}

export class CryptoSuite {
    public BlockFactory: BlockFactory;
    public TransactionManager: TransactionManager;
    public CryptoManager: CryptoManager;
    public Validator: Validator;

    public constructor(config = CryptoManager.findNetworkByName("testnet"), validatorOptions?: Record<string, any>) {
        this.CryptoManager = CryptoManager.createFromConfig(config) as CryptoManager;
        this.Validator = Validator.make(this.CryptoManager, validatorOptions);
        this.TransactionManager = new TransactionManager(this.CryptoManager, this.Validator);
        this.BlockFactory = new BlockFactory(this.CryptoManager, this.TransactionManager, this.Validator);
    }
}
