import "jest-extended";

import { configManager } from "@packages/crypto/src/managers";
import { Utils } from "@arkecosystem/crypto";
import { TransactionType } from "@packages/crypto/src/enums";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { Two } from "@packages/crypto/src/transactions/types";
import { IPFSBuilder } from "@packages/crypto/src/transactions/builders/transactions/ipfs";

import { Generators } from "@packages/core-test-framework/src";

let builder: IPFSBuilder;

beforeEach(() => {
    // todo: completely wrap this into a function to hide the generation and setting of the config?
    const config = Generators.generateCryptoConfigRaw();
    configManager.setConfig(config);

    builder = BuilderFactory.ipfs();
});

describe("IPFS Transaction", () => {
    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionType.Ipfs);
        expect(builder).toHaveProperty("data.fee", Two.IpfsTransaction.staticFee());
        expect(builder).toHaveProperty("data.amount", Utils.BigNumber.make(0));
        expect(builder).toHaveProperty("data.asset", {});
    });

    it("establishes the IPFS asset", () => {
        builder.ipfsAsset("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
        expect(builder.data.asset.ipfs).toBe("QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w");
    });
});
