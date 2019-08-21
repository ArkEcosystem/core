import { Container, Database } from "@arkecosystem/core-interfaces";
import { Networks, Utils } from "@arkecosystem/crypto";
import { StateBuilder } from "../../../../packages/core-database-postgres/src";
import { Delegate } from "../../../../packages/core-forger/src/delegate";
import { WalletManager } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { genesisBlock } from "../../../utils/config/unitnet/genesisBlock";
import { delegates, wallets } from "../../../utils/fixtures/unitnet";
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

beforeEach(async () => {
    walletManager = new WalletManager();
    database = container.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    await database.reset();
});

describe("Vote handler bootstrap", () => {
    it("should set vote attribute on wallet and update delegate vote balance on bootstrap", async () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const sender = wallets[11];

        const transaction = TransactionFactory.vote(delegates[2].publicKey)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp)
            .createOne();

        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const block = delegate.forge([transaction], optionsDefault);
        await database.connection.saveBlock(block);

        await stateBuilder.run();

        const senderWallet = walletManager.findByAddress(sender.address);
        expect(senderWallet.balance).toEqual(genesisWalletBalance(sender).minus(transaction.fee));
        expect(senderWallet.getAttribute("vote")).toEqual(delegates[2].publicKey);

        const delegateWallet = walletManager.findByPublicKey(delegates[2].publicKey);
        expect(delegateWallet.getAttribute("delegate.voteBalance")).toEqual(senderWallet.balance);
    });

    it("should remove vote attribute on wallet when unvote and update delegate vote balance on bootstrap", async () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const sender = wallets[11];

        const vote = TransactionFactory.vote(delegates[2].publicKey)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp)
            .createOne();
        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const blockVote = delegate.forge([vote], optionsDefault);
        await database.connection.saveBlock(blockVote);

        const unvote = TransactionFactory.unvote(delegates[2].publicKey)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp + 100)
            .withNonce(Utils.BigNumber.make(1)) // this will generate a transaction with nonce=2
            .createOne();
        const blockUnvote = delegate.forge([unvote], {
            timestamp: 12345789,
            previousBlock: {
                id: blockVote.data.id,
                height: 2,
            },
            reward: Utils.BigNumber.ZERO,
        });
        await database.connection.saveBlock(blockUnvote);

        await stateBuilder.run();

        const senderWallet = walletManager.findByAddress(sender.address);
        expect(senderWallet.balance).toEqual(
            genesisWalletBalance(sender)
                .minus(vote.fee)
                .minus(unvote.fee),
        );
        expect(senderWallet.hasAttribute("vote")).toBeFalse();

        const delegateWallet = walletManager.findByPublicKey(delegates[2].publicKey);
        expect(delegateWallet.getAttribute("delegate.voteBalance")).toEqual(Utils.BigNumber.ZERO);
    });
});
