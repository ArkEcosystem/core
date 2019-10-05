/* tslint:disable:no-console */

import pick from "lodash.pick";
import msgpack from "msgpack-lite";
import { Codec } from "../../../../packages/core-snapshots/src/transport/codec";
import { blocks } from "../fixtures/blocks";
import { transactions } from "../fixtures/transactions";

function jsonBlock(block) {
    // @ts-ignore
    block.reward = block.reward.toFixed();
    // @ts-ignore
    block.total_amount = block.total_amount.toFixed();
    // @ts-ignore
    block.total_fee = block.total_fee.toFixed();

    return block;
}

beforeAll(async () => {
    transactions.forEach((transaction: any) => {
        transaction.serialized = transaction.serializedHex;
    });
});

describe("Codec testing", () => {
    test("Encode/Decode single block", () => {
        console.time("singleblock");
        const encoded = msgpack.encode(blocks[1], { codec: Codec.blocks });
        const decoded = msgpack.decode(encoded, { codec: Codec.blocks });

        // removing helper property
        delete decoded.previous_block_hex;
        delete decoded.id_hex;

        expect(decoded).toEqual(jsonBlock({ ...blocks[1] }));
        console.timeEnd("singleblock");
    });

    test("Encode/Decode blocks", () => {
        console.time("blocks");
        for (const [index, block] of blocks.entries()) {
            // TODO: skipping genesis for now - wrong id calculation
            if (index === 0) {
                continue;
            }

            const encoded = msgpack.encode(block, { codec: Codec.blocks });
            const decoded = msgpack.decode(encoded, { codec: Codec.blocks });

            // removing helper property
            delete decoded.previous_block_hex;
            delete decoded.id_hex;

            expect(jsonBlock(block)).toEqual(decoded);
        }
        console.timeEnd("blocks");
    });

    test("Encode/Decode transfer transactions", () => {
        console.time("transactions ark transfer");
        const properties = [
            "id",
            "version",
            "block_id",
            "sequence",
            "sender_public_key",
            "recipient_id",
            "type",
            "vendor_field",
            "amount",
            "fee",
            "serialized",
        ];
        const transferTransactions = transactions.filter(trx => trx.type === 0);
        for (let i = 0; i < 100; i++) {
            for (const transaction of transferTransactions) {
                const encoded = msgpack.encode(transaction, {
                    codec: Codec.transactions,
                });
                const decoded = msgpack.decode(encoded, { codec: Codec.transactions });

                const source = pick(transaction, properties);
                const dest = pick(decoded, properties);
                expect(dest).toEqual(source);
            }
        }
        console.timeEnd("transactions ark transfer");
    });

    test("Encode/Decode transactions other than transfer", () => {
        console.time("transactions");
        const properties = [
            "id",
            "version",
            "block_id",
            "sequence",
            "sender_public_key",
            "type",
            "vendor_field",
            "amount",
            "fee",
            "serialized",
        ];

        const otherTransactions = transactions.filter(trx => trx.type > 0);
        for (const transaction of otherTransactions) {
            const encoded = msgpack.encode(transaction, { codec: Codec.transactions });
            const decoded = msgpack.decode(encoded, { codec: Codec.transactions });

            const source = pick(transaction, properties);
            const dest = pick(decoded, properties);
            expect(dest).toEqual(source);
        }
        console.timeEnd("transactions");
    });
});
