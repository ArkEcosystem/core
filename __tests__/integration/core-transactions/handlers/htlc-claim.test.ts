import { Container, Database } from "@arkecosystem/core-interfaces";
import { Networks, Utils } from "@arkecosystem/crypto";
import { StateBuilder } from "../../../../packages/core-database-postgres/src";
import { Delegate } from "../../../../packages/core-forger/src/delegate";
import { WalletManager } from "../../../../packages/core-state/src/wallets";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { genesisBlock } from "../../../utils/config/unitnet/genesisBlock";
import { wallets } from "../../../utils/fixtures/unitnet";
import { htlcSecretHex, htlcSecretHashHex } from "../../../utils/fixtures";
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

const makeTimestamp = (secondsRelativeToNow = 0) => Math.floor((Date.now() + secondsRelativeToNow * 1000) / 1000);

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

describe("Htlc claim handler bootstrap", () => {
    it("should initialize wallet with balance and locked balance on bootstrap", async () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const sender = wallets[11];
        const recipientId = "APmKYrtyyP34BdqQKyk71NbzQ2VKjG8sB3";
        const htlcLockAsset = {
            secretHash: htlcSecretHashHex,
            expiration: {
                type: 1,
                value: makeTimestamp(99),
            },
        };

        const lockTransaction = TransactionFactory.htlcLock(htlcLockAsset, recipientId)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp)
            .createOne();

        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const blockLock = delegate.forge([lockTransaction], optionsDefault);
        await database.connection.saveBlock(blockLock);

        const claimer = wallets[14];
        const claimTransaction = TransactionFactory.htlcClaim({
            unlockSecret: htlcSecretHex,
            lockTransactionId: lockTransaction.id,
        })
            .withNetwork("unitnet")
            .withPassphrase(claimer.passphrase) // anyone can ask for claim
            .withTimestamp(optionsDefault.timestamp + 1000)
            .createOne();
        const blockClaim = delegate.forge([claimTransaction], {
            timestamp: 12346689,
            previousBlock: {
                id: blockLock.data.id,
                height: 2,
            },
            reward: Utils.BigNumber.ZERO,
        });
        await database.connection.saveBlock(blockClaim);

        await stateBuilder.run();

        const recipientWallet = walletManager.findByAddress(recipientId);
        expect(recipientWallet.balance).toEqual(lockTransaction.amount);

        const senderWallet = walletManager.findByAddress(sender.address);

        expect(senderWallet.balance).toEqual(
            genesisWalletBalance(sender)
                .minus(lockTransaction.amount)
                .minus(lockTransaction.fee),
        );
        expect(senderWallet.getAttribute("htlc.lockedBalance")).toEqual(Utils.BigNumber.ZERO);

        const claimerWallet = walletManager.findByAddress(claimer.address);
        expect(claimerWallet.balance).toEqual(genesisWalletBalance(claimer));
    });
});
