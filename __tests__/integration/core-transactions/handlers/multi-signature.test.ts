import { Container, Database } from "@arkecosystem/core-interfaces";
import { Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
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

beforeAll(async () => {
    container = await setUp();

    Managers.configManager.getMilestone().aip11 = true;

    walletManager = new WalletManager();
    database = container.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);

    await database.reset();
});

afterAll(async () => {
    await database.reset();
    await tearDown();
});

describe("Multi signature handler bootstrap", () => {
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
        const participants = wallets.slice(0, 3);

        const transaction = TransactionFactory.multiSignature(participants.map(p => p.keys.publicKey), 3)
            .withNetwork("unitnet")
            .withPassphrase(sender.passphrase)
            .withPassphraseList(participants.map(p => p.passphrase))
            .withTimestamp(optionsDefault.timestamp)
            .createOne();

        const delegate = new Delegate("dummy passphrase", Networks.unitnet.network);
        const block = delegate.forge([transaction], optionsDefault);
        await database.connection.saveBlock(block);

        await stateBuilder.run();

        const multiSigAddress = Identities.Address.fromMultiSignatureAsset(transaction.asset.multiSignature);
        const multiSigPublicKey = Identities.PublicKey.fromMultiSignatureAsset(transaction.asset.multiSignature);
        const multisigWallet = walletManager.findByAddress(multiSigAddress);

        expect(multisigWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(multisigWallet.publicKey).toEqual(multiSigPublicKey);
        expect(multisigWallet.getAttribute("multiSignature")).toEqual(transaction.asset.multiSignature);
    });
});
