import "./mocks/core-container";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Memory } from "../../../packages/core-transaction-pool/src/memory";

Managers.configManager.setFromPreset("testnet");
Managers.configManager.getMilestone().aip11 = true;

describe("Memory", () => {
    describe("getLowestFeeLastNonce", () => {
        it("should get the lowest fee which also is the last nonce from the sender - when a 'last nonce tx' is among the 100 lowest fee txs", () => {
            const txs = [];
            let lastNonceLowestFeeTx;
            for (let i = 0; i < 100; i++) {
                for (let nonce = 1; nonce <= 10; nonce++) {
                    const passphrase = `random ${i}`;
                    const address = "AWLzbT4z7KntQ3D9LTz7ukPHyXy6mNy2YQ";
                    const transaction = Transactions.BuilderFactory.transfer()
                        .nonce(nonce.toString())
                        .recipientId(address)
                        .amount("1")
                        .fee((1e6 - 1000 * nonce - i).toString()) // the last nonce tx will be the lowest fee
                        .sign(passphrase)
                        .build();

                    txs.push(transaction);
                }
                const lastNonceTx = txs[txs.length - 1];
                lastNonceLowestFeeTx = lastNonceLowestFeeTx
                    ? lastNonceTx.data.fee.isLessThan(lastNonceLowestFeeTx.data.fee)
                        ? lastNonceTx
                        : lastNonceLowestFeeTx
                    : lastNonceTx;
            }

            const memory = new Memory(120);
            for (const tx of txs) {
                memory.remember(tx);
            }

            expect(memory.getLowestFeeLastNonce()).toEqual(lastNonceLowestFeeTx);
        });

        it("should get the lowest fee which also is the last nonce from the sender - when the 100 lowest fees are not a 'last nonce tx'", () => {
            const txs = [];
            let lastNonceLowestFeeTx;
            for (let i = 0; i < 100; i++) {
                for (let nonce = 1; nonce <= 10; nonce++) {
                    const passphrase = `random ${i}`;
                    const address = "AWLzbT4z7KntQ3D9LTz7ukPHyXy6mNy2YQ";
                    const transaction = Transactions.BuilderFactory.transfer()
                        .nonce(nonce.toString())
                        .recipientId(address)
                        .amount("1")
                        .fee((1000 * nonce + i).toString()) // the last nonce tx will be the biggest fee
                        .sign(passphrase)
                        .build();

                    txs.push(transaction);
                }
                const lastNonceTx = txs[txs.length - 1];
                lastNonceLowestFeeTx = lastNonceLowestFeeTx
                    ? lastNonceTx.data.fee.isLessThan(lastNonceLowestFeeTx.data.fee)
                        ? lastNonceTx
                        : lastNonceLowestFeeTx
                    : lastNonceTx;
            }

            const memory = new Memory(120);
            for (const tx of txs) {
                memory.remember(tx);
            }

            expect(memory.getLowestFeeLastNonce()).toEqual(lastNonceLowestFeeTx);
        });
    });

    describe("sortedByFee", () => {
        it.each([[undefined], [100], [190], [565], [1550]])(
            "should keep nonce order when sorting by fee and nonce - with limit %s",
            limit => {
                const txs = [];
                for (let i = 0; i < 50; i++) {
                    for (let nonce = 1; nonce <= 50; nonce++) {
                        const passphrase = `random ${i}`;
                        const address = "AWLzbT4z7KntQ3D9LTz7ukPHyXy6mNy2YQ";
                        const transaction = Transactions.BuilderFactory.transfer()
                            .nonce(nonce.toString())
                            .recipientId(address)
                            .amount("1")
                            .fee(Math.floor(Math.random() * 100000).toString()) //
                            .sign(passphrase)
                            .build();

                        txs.push(transaction);
                    }
                }

                const memory = new Memory(120);
                for (const tx of txs) {
                    memory.remember(tx);
                }

                const byFee = [...memory.sortedByFee(limit)];

                // checking that nonces are in order
                const lastNonceBySender: { [id: string]: Utils.BigNumber } = {};
                for (const tx of byFee) {
                    const sender = tx.data.senderPublicKey;
                    if (lastNonceBySender[sender]) {
                        expect(tx.data.nonce).toEqual(lastNonceBySender[sender].plus(1));
                    } else {
                        expect(tx.data.nonce).toEqual(Utils.BigNumber.ONE);
                    }
                    lastNonceBySender[sender] = tx.data.nonce;
                }
            },
        );
    });
});
