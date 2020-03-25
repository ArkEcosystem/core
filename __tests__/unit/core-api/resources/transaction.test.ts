import "jest-extended";
import { TransactionResource } from "@packages/core-api/src/resources";
import { BuilderFactory } from "@packages/crypto/src/transactions";
import { Identities, Interfaces, Utils } from "@packages/crypto";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Application } from "@packages/core-kernel";
import { initApp, parseObjectWithBigInt } from "../__support__";
import { Mocks } from "@packages/core-test-framework";

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
            let result = <any>(resource.raw(transferTransaction));

            let expectedResult = parseObjectWithBigInt(transferTransaction.data);
            delete expectedResult.typeGroup;

            expect(result).toEqual(expect.objectContaining(expectedResult));
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            let result = <any>(resource.transform(transferTransaction));

            let expectedResult = parseObjectWithBigInt(transferTransaction.data);
            expectedResult.confirmations = 0;
            delete expectedResult.expiration;
            delete expectedResult.network;
            delete expectedResult.timestamp;
            delete expectedResult.recipientId;

            expect(result).toEqual(expect.objectContaining(
                expectedResult
            ));
        });

        it("should return transformed object when contain block", async () => {
            let mockBlock: Partial<Interfaces.IBlockData> = {
                id: "17184958558311101492",
                version: 2,
                height: 2,
                timestamp: 2,
                reward: Utils.BigNumber.make("100"),
                totalFee: Utils.BigNumber.make("200"),
                totalAmount: Utils.BigNumber.make("300"),
                generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0])
            };

            Mocks.Blockchain.setMockBlock({data: mockBlock} as Partial<Interfaces.IBlock>);

            // @ts-ignore
            transferTransaction.block = mockBlock;

            let result = <any>(resource.transform(transferTransaction));

            let expectedResult = parseObjectWithBigInt(transferTransaction.data);
            expectedResult.confirmations = 1;
            delete expectedResult.expiration;
            delete expectedResult.network;
            delete expectedResult.timestamp;
            delete expectedResult.recipientId;

            expect(result).toEqual(expect.objectContaining(
                expectedResult
            ));
        });
    });
});
