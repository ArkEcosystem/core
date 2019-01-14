import "jest-extended";
import { IPFSBuilder } from "../../../dist/builder";
import { client as ark } from "../../../dist/client";
import { TransactionTypes } from "../../../dist/constants";
import { feeManager } from "../../../dist/managers/fee";
import { transactionBuilder } from "./__shared__/transaction-builder";

let builder : IPFSBuilder;

beforeEach(() => {
    builder = ark.getBuilder().ipfs();
});

describe("IPFS Transaction", () => {
    transactionBuilder(() => builder);

    it("should have its specific properties", () => {
        expect(builder).toHaveProperty("data.type", TransactionTypes.Ipfs);
        expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.Ipfs));
        expect(builder).toHaveProperty("data.amount", 0);
        expect(builder).toHaveProperty("data.vendorFieldHex", null);
        expect(builder).toHaveProperty("data.senderPublicKey", null);
        expect(builder).toHaveProperty("data.asset", {});
    });

    it("should not have the IPFS hash yet", () => {
        expect(builder).not.toHaveProperty("data.ipfsHash");
    });

    it("establishes the IPFS hash", () => {
        builder.ipfsHash("zyx");
        expect(builder.data.ipfsHash).toBe("zyx");
    });

    // TODO This is test is OK, but the Subject Under Test might be wrong,
    // so it is better to not assume that this is the desired behaviour
    it("should generate and set the vendorFieldHex", () => {
        const data = "hash";
        // @ts-ignore
        const hex: any = Buffer.from(data, 0).toString("hex");
        const paddedHex = hex.padStart(128, "0");

        builder.data.ipfsHash = data;
        builder.vendorField(0);
        expect(builder.data.vendorFieldHex).toBe(paddedHex);
    });
});
