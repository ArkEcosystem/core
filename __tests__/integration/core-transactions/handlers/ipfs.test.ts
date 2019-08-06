import { Container, Database, State } from "@arkecosystem/core-interfaces";
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

describe("IPFS bootstrap", () => {
    const ipfsIds = [
        "QmR45FmbVVrixReBwJkhEKde2qwHYaQzGxu4ZoDeswuF9w",
        "QmYSK2JyM3RyDyB52caZCTKFR3HKniEcMnNJYdk8DQ6KKB",
        "QmQeUqdjFmaxuJewStqCLUoKrR9khqb4Edw9TfRQQdfWz3",
        "Qma98bk1hjiRZDTmYmfiUXDj8hXXt7uGA5roU5mfUb3sVG",
    ];

    it("should initialize wallet with associated ipfs hash on bootstrap", async () => {
        const optionsDefault = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const sender = wallets[11];

        const transaction = TransactionFactory.ipfs(ipfsIds[0])
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withTimestamp(optionsDefault.timestamp)
            .createOne();

        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const block = delegate.forge([transaction], optionsDefault);
        await database.connection.saveBlock(block);

        await stateBuilder.run();

        const ipfsWallet = walletManager.findByAddress(sender.address);
        const ipfsHashes: State.IWalletIpfsAttributes = ipfsWallet.getAttribute("ipfs.hashes");
        expect(ipfsHashes[ipfsIds[0]]).toBeDefined();
        expect(ipfsWallet.balance).toEqual(genesisWalletBalance(sender).minus(transaction.fee));
    });
});
