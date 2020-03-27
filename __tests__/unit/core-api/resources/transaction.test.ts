import "jest-extended";

import { TransactionResource } from "@packages/core-api/src/resources";
import { Application } from "@packages/core-kernel";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Identities, Interfaces, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";

import { initApp, parseObjectWithBigInt } from "../__support__";

let app: Application;
let resource: TransactionResource;

beforeEach(() => {
    app = initApp();

    resource = app.resolve<TransactionResource>(TransactionResource);
});

describe("TransactionResource", () => {
    let transferTransaction: Interfaces.ITransaction;

    beforeEach(() => {
        transferTransaction = BuilderFactory.transfer()
            .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
            .amount("1")
            .nonce("1")
            .sign(passphrases[0])
            .build();
    });

    describe("raw", () => {
        it("should return raw object", async () => {
            const result = <any>resource.raw(transferTransaction);

            const expectedResult = parseObjectWithBigInt(transferTransaction.data);
            delete expectedResult.typeGroup;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            const result = <any>resource.transform(transferTransaction);

            const expectedResult = parseObjectWithBigInt(transferTransaction.data);
            expectedResult.confirmations = 0;
            delete expectedResult.expiration;
            delete expectedResult.network;
            delete expectedResult.timestamp;
            delete expectedResult.recipientId;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });

        it("should return transformed object when contain block", async () => {
            const mockBlock: Partial<Interfaces.IBlockData> = {
                id: "17184958558311101492",
                version: 2,
                height: 2,
                timestamp: 2,
                reward: Utils.BigNumber.make("100"),
                totalFee: Utils.BigNumber.make("200"),
                totalAmount: Utils.BigNumber.make("300"),
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
            };

            Mocks.Blockchain.setBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            // @ts-ignore
            transferTransaction.block = mockBlock;

            const result = <any>resource.transform(transferTransaction);

            const expectedResult = parseObjectWithBigInt(transferTransaction.data);
            expectedResult.confirmations = 1;
            delete expectedResult.expiration;
            delete expectedResult.network;
            delete expectedResult.timestamp;
            delete expectedResult.recipientId;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });
});
