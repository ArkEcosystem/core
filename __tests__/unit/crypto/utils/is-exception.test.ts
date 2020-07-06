import "jest-extended";

import { configManager } from "../../../../packages/crypto/src/managers";
import { isException } from "../../../../packages/crypto/src/utils";
import { IBlockData } from "../../../../packages/crypto/src/interfaces";

describe("IsException", () => {
    let spyConfigGet;

    beforeEach(() => {
        jest.restoreAllMocks();
        spyConfigGet = jest.spyOn(configManager, "get");
    })

    describe("when id is 64 bytes long", () => {
        it("should return true when id is defined as an exception", () => {
            const id = "d82ef1452ed61d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";

            spyConfigGet.mockReturnValue([id]);

            expect(isException({ id } as IBlockData)).toBeTrue();
        });

        it("should return false", () => {
            const id = "d83ef1452ed61d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";
            spyConfigGet.mockReturnValue(["1"]);
            expect(isException({ id } as IBlockData)).toBeFalse();

            spyConfigGet.mockReturnValue(undefined);
            expect(isException({ id } as IBlockData)).toBeFalse();

            spyConfigGet.mockReturnValue(undefined);
            expect(isException({ id: undefined } as IBlockData)).toBeFalse();
        });
    });

    describe("when id is < 64 bytes long (old block ids)", () => {
        it.each([
            [
                "72d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5",
                ["b9fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034"],
            ],
            ["73d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5", []],
            [
                "74d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5",
                [
                    "b8fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
                    "b7fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
                    "b6fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
                ],
            ],
        ])(
            "should return true when block id is defined as an exception along with its transactions",
            (blockId: string, txs: string[]) => {
                spyConfigGet
                    .mockReturnValueOnce({ [blockId]: txs }) // exceptions.blocksTransactions
                    .mockReturnValueOnce(blockId) // network.pubKeyHash
                    .mockReturnValueOnce([blockId]) // exceptions.blocks
                    .mockReturnValueOnce([]); // exceptions.transactions

                expect(isException({ id: blockId, transactions: txs.map(id => ({ id })) } as IBlockData)).toBeTrue();
            },
        );

        it("should return true when block exception transactions are in different order than the ones to check", () => {
            const blockId = "83d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";
            const txs = [
                "b1fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
                "b2fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
                "b3fdb54370ac2334790942738784063475db70d5564598dbd714681bb02e3034",
            ];
            const txsShuffled = [txs[1], txs[0], txs[2]];

            spyConfigGet
                .mockReturnValueOnce({ [blockId]: txs }) // exceptions.blocksTransactions
                .mockReturnValueOnce(blockId) // network.pubKeyHash
                .mockReturnValueOnce([blockId]) // exceptions.blocks
                .mockReturnValueOnce([]); // exceptions.transactions

            expect(
                isException({ id: blockId, transactions: txsShuffled.map(id => ({ id })) } as IBlockData),
            ).toBeTrue();
        });

        it("should return true when transactions is undefined and block transactions exceptions are empty array", () => {
            const blockId = "63d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";

            spyConfigGet
                .mockReturnValueOnce({ [blockId]: [] }) // exceptions.blocksTransactions
                .mockReturnValueOnce(blockId) // network.pubKeyHash
                .mockReturnValueOnce([blockId]) // exceptions.blocks
                .mockReturnValueOnce([]); // exceptions.transactions

            expect(isException({ id: blockId, transactions: undefined } as IBlockData)).toBeTrue();
        });

        it("should return false when transactions is undefined and there are transactions defined in exception", () => {
            const blockId = "63d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";

            spyConfigGet
                .mockReturnValueOnce({ [blockId]: ["b9fdb54270ac2334790942345784066875db70d5564598dbd714681bb02e3034"] }) // exceptions.blocksTransactions
                .mockReturnValueOnce(blockId) // network.pubKeyHash
                .mockReturnValueOnce([blockId]) // exceptions.blocks
                .mockReturnValueOnce([]); // exceptions.transactions

            expect(isException({ id: blockId, transactions: undefined } as IBlockData)).toBeFalse();
        });

        it("should return false when transactions length is different than exception transactions length", () => {
            const blockId = "64d9217c9b6a7328afa833586fdb19390c9c5e61b7801447428a5";
            const transactions = [
                "b9fdb54270ac2334790942738784066875db70d5564598dbd714681bb02e3034",
                "b9fdb87970ac2334790942738784066875db70d5564598dbd714681bb02e3034",
            ];

            spyConfigGet
                .mockReturnValueOnce({ [blockId]: transactions }) // exceptions.blocksTransactions
                .mockReturnValueOnce(blockId) // network.pubKeyHash
                .mockReturnValueOnce([blockId]) // exceptions.blocks
                .mockReturnValueOnce([]); // exceptions.transactions

            expect(isException({ id: blockId, transactions: [{ id: transactions[0] }] } as IBlockData)).toBeFalse();
        });
    });
});
