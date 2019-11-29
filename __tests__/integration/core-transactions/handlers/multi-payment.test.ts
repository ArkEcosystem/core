import { Container, Database } from "@arkecosystem/core-interfaces";
import { Networks, Utils } from "@arkecosystem/crypto";
import { StateBuilder } from "../../../../packages/core-database-postgres/src";
import { Delegate } from "../../../../packages/core-forger/src/delegate";
import { WalletManager } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { genesisBlock } from "../../../utils/config/unitnet/genesisBlock";
import { wallets } from "../../../utils/fixtures/unitnet";
import { setUp, tearDown } from "../__support__/setup";

let container: Container.IContainer;
let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;

const genesisWalletBalance = wallet =>
    genesisBlock.transactions
        .filter(t => t.recipientId === wallet.address)
        .reduce((prev, curr) => prev.plus(curr.amount), Utils.BigNumber.ZERO)
        .minus(
            genesisBlock.transactions
                .filter(t => t.senderPublicKey === wallet.publicKey)
                .reduce((prev, curr) => prev.plus(curr.amount).plus(curr.fee), Utils.BigNumber.ZERO),
        );

beforeAll(async () => {
    container = await setUp();

    walletManager = new WalletManager();
    database = container.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);

    await database.reset();
});

afterAll(async () => {
    await database.reset();
    await tearDown();
});

describe("Multi payment handler bootstrap", () => {
    it("should initialize wallet with balance on bootstrap", async () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const sender = wallets[11];
        const payments = [
            { recipientId: "APmKYrtyyP34BdqQKyk71NbzQ2VKjG8sB3", amount: "100" },
            { recipientId: "AdgQLnQ2YL1Kdqr5XA6EBomD5AETDgiNhE", amount: "200" },
            { recipientId: "AdbHjxqFGSXXVuwFNB8cCPWRDkhanRNwKg", amount: "300" },
            { recipientId: "AUQ2AL2hDaqBznFqBTh8oJBHAFYqWfXP1k", amount: "400" },
        ];

        const transaction = TransactionFactory.multiPayment(payments)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp)
            .createOne();

        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const block = delegate.forge([transaction], optionsDefault);
        await database.connection.saveBlock(block);

        await stateBuilder.run();

        for (const { recipientId, amount } of payments) {
            const recipientWallet = walletManager.findByAddress(recipientId);
            expect(recipientWallet.balance).toEqual(Utils.BigNumber.make(amount));
        }

        const senderWallet = walletManager.findByAddress(sender.address);
        expect(senderWallet.balance).toEqual(
            genesisWalletBalance(sender)
                .minus(payments.reduce((prev, curr) => prev.plus(curr.amount), Utils.BigNumber.ZERO))
                .minus(transaction.fee),
        );
    });
});
