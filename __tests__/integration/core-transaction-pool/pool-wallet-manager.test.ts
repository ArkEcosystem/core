import { Blockchain, Container, Database } from "@arkecosystem/core-interfaces";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions";
import { Blocks, Crypto, Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates, genesisBlock, wallets } from "../../utils/fixtures/unitnet";
import { generateWallets } from "../../utils/generators/wallets";
import { setUpFull, tearDownFull } from "./__support__/setup";

const { BlockFactory } = Blocks;
const { crypto } = Crypto;

const satoshi = 1e8;
let container: Container.IContainer;
let PoolWalletManager;
let poolWalletManager;
let blockchain: Blockchain.IBlockchain;

beforeAll(async () => {
    container = await setUpFull();

    PoolWalletManager = require("../../../packages/core-transaction-pool/src").PoolWalletManager;
    poolWalletManager = new PoolWalletManager();
    blockchain = container.resolvePlugin<Blockchain.IBlockchain>("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

describe("canApply", () => {
    it("should add an error for delegate registration when username is already taken", () => {
        const delegateReg = TransactionFactory.delegateRegistration("genesis_11")
            .withNetwork("unitnet")
            .withPassphrase(wallets[11].passphrase)
            .build()[0];
        const errors = [];

        expect(poolWalletManager.canApply(delegateReg, errors)).toBeFalse();
        expect(errors).toEqual([
            `Failed to apply transaction, because the username '${
                delegateReg.data.asset.delegate.username
            }' is already registered.`,
        ]);
    });

    it("should add an error when voting for a delegate that doesn't exist", () => {
        const vote = TransactionFactory.vote(wallets[12].keys.publicKey)
            .withNetwork("unitnet")
            .withPassphrase(wallets[11].passphrase)
            .build()[0];
        const errors = [];

        expect(poolWalletManager.canApply(vote, errors)).toBeFalse();
        expect(errors).toEqual([`Failed to apply transaction, because only delegates can be voted.`]);
    });
});

describe("applyPoolTransactionToSender", () => {
    describe("update the balance", () => {
        it("should only update the balance of the sender", async () => {
            const delegate0 = delegates[0];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = poolWalletManager.findByAddress(delegate0.address);
            const newWallet = poolWalletManager.findByAddress(newAddress);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const transfer = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withPassphrase(delegate0.secret)
                .build()[0];

            const transactionHandler = TransactionHandlerRegistry.get(transfer.type);
            transactionHandler.applyToSender(transfer, delegateWallet);

            expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - 0.1 * 10 ** 8);
            expect(newWallet.balance.isZero()).toBeTrue();
        });

        it("should only update the balance of the sender with dyn fees", async () => {
            const delegate0 = delegates[1];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = poolWalletManager.findByAddress(delegate0.address);
            const newWallet = poolWalletManager.findByAddress(newAddress);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const fee = 10;
            const transfer = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withFee(fee)
                .withPassphrase(delegate0.secret)
                .build()[0];

            const transactionHandler = TransactionHandlerRegistry.get(transfer.type);
            transactionHandler.applyToSender(transfer, delegateWallet);

            expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - fee);
            expect(newWallet.balance.isZero()).toBeTrue();
        });

        it("should not apply chained transfers", async () => {
            const delegate = delegates[7];
            const delegateWallet = poolWalletManager.findByPublicKey(delegate.publicKey);

            const walletsGen = generateWallets("unitnet", 4);
            const poolWallets = walletsGen.map(w => poolWalletManager.findByAddress(w.address));

            expect(+delegateWallet.balance).toBe(+delegate.balance);
            poolWallets.forEach(w => {
                expect(+w.balance).toBe(0);
            });

            const transfers = [
                {
                    // transfer from delegate to wallet 0
                    from: delegate,
                    to: walletsGen[0],
                    amount: 100 * satoshi,
                },
                {
                    // transfer from wallet 0 to delegatej
                    from: walletsGen[0],
                    to: delegate,
                    amount: 55 * satoshi,
                },
            ];

            transfers.forEach(t => {
                const transfer = TransactionFactory.transfer(t.to.address, t.amount)
                    .withNetwork("unitnet")
                    .withPassphrase(t.from.passphrase)
                    .build()[0];
                const transactionHandler = TransactionHandlerRegistry.get(transfer.type);

                // This is normally refused because it's a cold wallet, but since we want
                // to test if chained transfers are refused, pretent it is not a cold wallet.
                container
                    .resolvePlugin<Database.IDatabaseService>("database")
                    .walletManager.findByPublicKey(transfer.data.senderPublicKey);

                const errors = [];
                if (poolWalletManager.canApply(transfer, errors)) {
                    const senderWallet = poolWalletManager.findByPublicKey(transfer.data.senderPublicKey);
                    transactionHandler.applyToSender(transfer, senderWallet);

                    expect(t.from).toBe(delegate);
                } else {
                    expect(t.from).toBe(walletsGen[0]);
                    expect(errors).toEqual(["Insufficient balance in the wallet."]);
                }

                (container.resolvePlugin<Database.IDatabaseService>("database").walletManager as any).forgetByPublicKey(
                    transfer.data.senderPublicKey,
                );
            });

            expect(+delegateWallet.balance).toBe(delegate.balance - (100 + 0.1) * satoshi);
            expect(poolWallets[0].balance.isZero()).toBeTrue();
        });
    });
});

describe("Apply transactions and block rewards to wallets on new block", () => {
    // tslint:disable-next-line:variable-name
    const __resetToHeight1 = async () => blockchain.removeBlocks(blockchain.getLastHeight() - 1);

    beforeEach(__resetToHeight1);
    afterEach(__resetToHeight1);

    it.each([2 * satoshi, 0])("should apply forged block reward %i to delegate wallet", async reward => {
        const forgingDelegate = delegates[reward ? 2 : 3]; // use different delegate to have clean initial balance
        const generatorPublicKey = forgingDelegate.publicKey;

        const wallet = generateWallets("unitnet", 1)[0];
        const transferAmount = 1234;
        const transferDelegate = delegates[4];
        const transfer = TransactionFactory.transfer(wallet.address, transferAmount)
            .withNetwork("unitnet")
            .withPassphrase(transferDelegate.passphrase)
            .create()[0];

        const totalFee = 0.1 * satoshi;
        const blockWithReward = {
            id: "17882607875259085966",
            version: 0,
            timestamp: 46583330,
            height: 2,
            reward: Utils.BigNumber.make(reward),
            previousBlock: genesisBlock.id,
            numberOfTransactions: 1,
            transactions: [transfer],
            totalAmount: transfer.amount,
            totalFee: Utils.BigNumber.make(totalFee),
            payloadLength: 0,
            payloadHash: genesisBlock.payloadHash,
            generatorPublicKey,
            blockSignature:
                "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            createdAt: "2019-07-11T16:48:50.550Z",
        };
        const blockWithRewardVerified = BlockFactory.fromData(blockWithReward);
        blockWithRewardVerified.verification.verified = true;

        await blockchain.processBlock(blockWithRewardVerified, () => null);

        const delegateWallet = poolWalletManager.findByPublicKey(generatorPublicKey);

        const poolWallet = poolWalletManager.findByAddress(wallet.address);
        expect(+poolWallet.balance).toBe(transferAmount);

        const transferDelegateWallet = poolWalletManager.findByAddress(transferDelegate.address);
        expect(+transferDelegateWallet.balance).toBe(+transferDelegate.balance - transferAmount - totalFee);

        expect(+delegateWallet.balance).toBe(+forgingDelegate.balance + reward + totalFee); // balance increased by reward + fee
    });
});
