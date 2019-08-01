import "jest-extended";

import { Utils } from "@arkecosystem/crypto";
import { TransactionType } from "../../../../../../packages/crypto/src/enums";
import { BuilderFactory, IpfsTransaction } from "../../../../../../packages/crypto/src/transactions";
import { IPFSBuilder } from "../../../../../../packages/crypto/src/transactions/builders/transactions/ipfs";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder: IPFSBuilder;

beforeEach(() => {
    builder = BuilderFactory.ipfs();
});

describe("IPFS Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Ipfs);
        expect(builder).toHaveProperty("data.fee", IpfsTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    it("establishes the IPFS asset", () => {
        builder.ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
        expect(builder.data.asset.ipfs).toBe("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
    });
});
