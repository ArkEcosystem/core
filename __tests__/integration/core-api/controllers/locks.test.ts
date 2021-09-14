import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { ApiInjectClient } from "@arkecosystem/core-test-framework";
import { Enums, Identities, Managers, Utils } from "@arkecosystem/crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

beforeAll(() => {
    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const genesisBlock = Managers.configManager.get("genesisBlock");

    for (let i = 0; i < 7; i++) {
        const walletPublicKey = Identities.PublicKey.fromPassphrase(`wallet-${i}`);
        const wallet = walletRepository.findByPublicKey(walletPublicKey);
        const walletLocks = {};

        const transactions = genesisBlock.transactions.slice(i * 3, i * 3 + i + 1);
        for (let j = 0; j < transactions.length; j++) {
            const n = (i + 1) * (j + 1);
            const transaction = transactions[j];

            walletLocks[transaction.id] = {
                amount: Utils.BigNumber.make(n * 10),
                recipientId: wallet.getAddress(),
                secretHash: transaction.id,
                expiration:
                    j % 2 === 0
                        ? { type: Enums.HtlcLockExpirationType.EpochTimestamp, value: n * 100000 + 1000 }
                        : { type: Enums.HtlcLockExpirationType.BlockHeight, value: n * 100 },
                timestamp: n * 100000,
            };
        }

        wallet.setAttribute("htlc.locks", walletLocks);
        walletRepository.index(wallet);
    }
});

describe("/locks", () => {
    it("should return locks sorted by timestamp.unix:desc", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/locks");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const locks = response.body.data;
        let prevTimestamp = locks[0].timestamp.unix;
        for (const lock of locks) {
            expect(lock.timestamp.unix).toBeLessThanOrEqual(prevTimestamp);
            prevTimestamp = lock.timestamp.unix;
        }
    });

    it("should return locks with amount less than 50", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get(`/locks?amount.to=50`);

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const locks = response.body.data;
        for (const lock of locks) {
            const lockAmount = Utils.BigNumber.make(lock.amount);
            expect(lockAmount.isLessThanEqual(50)).toBe(true);
        }
    });
});

describe("/locks/unlocked", () => {
    it("should return 422 response status when payload is empty object", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.post("/locks/unlocked", {});

        expect(response).toMatchObject({
            status: 422,
        });
    });
});
