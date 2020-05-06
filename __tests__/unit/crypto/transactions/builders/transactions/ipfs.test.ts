import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto/src";
import * as Generators from "@packages/core-test-framework/src/app/generators";
import { TransactionType } from "@packages/crypto/src/enums";
import { IPFSBuilder } from "@packages/crypto/src/transactions/builders/transactions/ipfs";
import { Two } from "@packages/crypto/src/transactions/types";

let crypto: CryptoManager<any>;
let builder: IPFSBuilder<any, Interfaces.ITransactionData, any>;
let transactionsManager: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;

beforeEach(() => {
    crypto = CryptoManager.createFromConfig(Generators.generateCryptoConfigRaw());

    transactionsManager = new Transactions.TransactionsManager(crypto, {
        extendTransaction: () => {},
        // @ts-ignore
        validate: (_, data) => ({
            value: data,
        }),
    });

    builder = transactionsManager.BuilderFactory.ipfs();
});

describe("IPFS Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Ipfs);
        expect(builder).toHaveProperty("data.fee", Two.IpfsTransaction.staticFee(crypto));
        expect(builder).toHaveProperty("data.amount", crypto.LibraryManager.Libraries.BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    it("establishes the IPFS asset", () => {
        builder.ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
        expect(builder.data.asset.ipfs).toBe("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
    });
});
