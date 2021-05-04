import "@packages/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { ApiHelpers, TransactionFactory } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API 2.0 - Locks", () => {
    let lockIds;
    let walletRepository: Contracts.State.WalletRepository;

    beforeEach(() => {
        walletRepository = app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "blockchain",
        );
        walletRepository.reset();

        lockIds = [];

        for (let i = 1; i < 7; i++) {
            const wallet = walletRepository.findByAddress(Identities.Address.fromPassphrase(`${i}`));
            wallet.setPublicKey(Identities.PublicKey.fromPassphrase(`${i}`));

            const transactions = Managers.configManager.get("genesisBlock").transactions.slice(i * 10, i * 10 + i + 1);

            const locks = {};
            for (let j = 0; j < transactions.length; j++) {
                const transaction = transactions[j];
                lockIds.push(transaction.id);

                locks[transaction.id] = {
                    amount: Utils.BigNumber.make(10 * (j + 1)),
                    recipientId: wallet.getAddress(),
                    secretHash: transaction.id,
                    expiration: {
                        type: j % 2 === 0 ? 1 : 2,
                        value: !j ? 0 : 100 * (j + 1),
                    },
                    timestamp: (i + 1) * 100000,
                };
            }

            wallet.setAttribute("htlc.locks", locks);

            walletRepository.index(wallet);
        }
    });

    describe("POST /locks/unlocked", () => {
        it("should find matching transactions for the given lock ids", async () => {
            const refundTransaction = TransactionFactory.initialize(app)
                .htlcRefund({
                    lockTransactionId: lockIds[0],
                })
                .build()[0];

            const transactionRepository = app.get<Repositories.TransactionRepository>(
                Container.Identifiers.DatabaseTransactionRepository,
            );

            jest.spyOn(transactionRepository, "listByExpression").mockResolvedValueOnce({
                results: [{ ...refundTransaction.data, serialized: refundTransaction.serialized } as any],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

            const response = await api.request("POST", "locks/unlocked", {
                ids: [lockIds[0]],
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            expect(refundTransaction.id).toEqual(response.data.data[0].id);
        });
    });
});
