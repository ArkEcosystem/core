import { Blockchain, Container, Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Identities, Utils } from "@arkecosystem/crypto";
import { generateMnemonic } from "bip39";
import { Blockchain as BlockchainClass } from "../../../packages/core-blockchain/src";
import { BlockProcessor } from "../../../packages/core-blockchain/src/processor";
import { WalletManager } from "../../../packages/core-transaction-pool/src/wallet-manager";
import { TransactionFactory } from "../../helpers/transaction-factory";
import { delegates, genesisBlock, wallets } from "../../utils/fixtures/unitnet";
import { generateWallets } from "../../utils/generators/wallets";
import { setUpFull, tearDownFull } from "./__support__/setup";

const satoshi = 1e8;
let container: Container.IContainer;
let poolWalletManager: WalletManager;
let blockchain: Blockchain.IBlockchain;

beforeAll(async () => {
    container = await setUpFull();

    poolWalletManager = new WalletManager();
    blockchain = container.resolvePlugin<Blockchain.IBlockchain>("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

describe("throwIfCannotBeApplied", () => {
    it("should add an error for delegate registration when username is already taken", async () => {
        const delegateReg = TransactionFactory.delegateRegistration("genesis_11")
            .withNetwork("unitnet")
            .withPassphrase(wallets[11].passphrase)
            .build()[0];

        const username: string = delegateReg.data.asset.delegate.username;

        await expect(poolWalletManager.throwIfCannotBeApplied(delegateReg)).rejects.toThrow(
            `Failed to apply transaction, because the username '${username}' is already registered.`,
        );
    });

    it("should add an error when voting for a delegate that doesn't exist", async () => {
        const vote = TransactionFactory.vote(wallets[12].keys.publicKey)
            .withNetwork("unitnet")
            .withPassphrase(wallets[11].passphrase)
            .build()[0];

        await expect(poolWalletManager.throwIfCannotBeApplied(vote)).rejects.toThrow(
            `Failed to apply transaction, because only delegates can be voted.`,
        );
    });
});

describe("applyPoolTransactionToSender", () => {
    describe("update the balance", () => {
        it("should only update the balance of the sender", async () => {
            const delegate0 = delegates[0];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

            const delegateWallet = poolWalletManager.findByAddress(delegate0.address);
            const newWallet = poolWalletManager.findByAddress(newAddress);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const transfer = TransactionFactory.transfer(newAddress, amount1)
                .withNetwork("unitnet")
                .withPassphrase(delegate0.secret)
                .build()[0];

            poolWalletManager.reindex(delegateWallet);
            poolWalletManager.reindex(newWallet);

            const transactionHandler = await Handlers.Registry.get(transfer.type);
            await transactionHandler.applyToSender(transfer, poolWalletManager);

            expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - 0.1 * 10 ** 8);
            expect(newWallet.balance.isZero()).toBeTrue();
        });

        it("should only update the balance of the sender with dyn fees", async () => {
            const delegate0 = delegates[1];
            const { publicKey } = Identities.Keys.fromPassphrase(generateMnemonic());
            const newAddress = Identities.Address.fromPublicKey(publicKey);

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

            poolWalletManager.reindex(delegateWallet);
            poolWalletManager.reindex(newWallet);

            const transactionHandler = await Handlers.Registry.get(transfer.type);
            await transactionHandler.applyToSender(transfer, poolWalletManager);

            expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - fee);
            expect(newWallet.balance.isZero()).toBeTrue();
        });

        it("should not apply chained transfers", async () => {
            const delegate = delegates[7];
            const delegateWallet = poolWalletManager.findByPublicKey(delegate.publicKey);

            const walletsGen = generateWallets("unitnet", 4);
            const poolWallets = walletsGen.map(w => poolWalletManager.findByAddress(w.address));

            expect(+delegateWallet.balance).toBe(+delegate.balance);
            for (const w of poolWallets) {
                expect(+w.balance).toBe(0);
            }

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

            for (const t of transfers) {
                const transfer = TransactionFactory.transfer(t.to.address, t.amount)
                    .withNetwork("unitnet")
                    .withPassphrase(t.from.passphrase)
                    .build()[0];
                const transactionHandler = await Handlers.Registry.get(transfer.type);

                // This is normally refused because it's a cold wallet, but since we want
                // to test if chained transfers are refused, pretent it is not a cold wallet.
                container
                    .resolvePlugin<Database.IDatabaseService>("database")
                    .walletManager.findByPublicKey(transfer.data.senderPublicKey);

                try {
                    await poolWalletManager.throwIfCannotBeApplied(transfer);
                    await transactionHandler.applyToSender(transfer, poolWalletManager);
                    expect(t.from).toBe(delegate);
                } catch (error) {
                    expect(t.from).toBe(walletsGen[0]);
                    expect(error.message).toEqual("Insufficient balance in the wallet.");
                }

                (container.resolvePlugin<Database.IDatabaseService>("database").walletManager as any).forgetByPublicKey(
                    transfer.data.senderPublicKey,
                );
            }

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
        const blockWithRewardVerified = Blocks.BlockFactory.fromData(blockWithReward);
        blockWithRewardVerified.verification.verified = true;
        const processor = new BlockProcessor(blockchain as BlockchainClass);

        await processor.process(blockWithRewardVerified);

        const delegateWallet = poolWalletManager.findByPublicKey(generatorPublicKey);

        const poolWallet = poolWalletManager.findByAddress(wallet.address);
        expect(+poolWallet.balance).toBe(transferAmount);

        const transferDelegateWallet = poolWalletManager.findByAddress(transferDelegate.address);
        expect(+transferDelegateWallet.balance).toBe(+transferDelegate.balance - transferAmount - totalFee);

        expect(+delegateWallet.balance).toBe(+forgingDelegate.balance + reward + totalFee); // balance increased by reward + fee
    });
});

describe("findByIndex", () => {
    describe("when transaction pool wallet manager does not find a wallet by index", () => {
        it("should get the wallet from database wallet manager if it exists", async () => {
            const publicKey = "02664fe58caa4a960ed74169a5968a5f69587ba50b75087d268f5788af3a5bf56d";
            const address = Identities.Address.fromPublicKey(publicKey);
            const lockId = "cd08f14f049ea0ff0661635929ed267275e71509561c78d72a55a0bbccc48c30";
            const walletWithHtlcLock = Object.assign(new Wallets.Wallet(address), {
                attributes: {
                    htlc: {
                        locks: {
                            [lockId]: {
                                amount: Utils.BigNumber.make(10),
                                recipientId: address,
                                secretHash: lockId,
                                expiration: {
                                    type: 1,
                                    value: 100,
                                },
                            },
                        },
                    },
                },
            });
            container.resolvePlugin<Database.IDatabaseService>("database").walletManager.reindex(walletWithHtlcLock);

            const poolWallet = poolWalletManager.findByIndex(State.WalletIndexes.Locks, lockId);
            expect(poolWallet).toEqual(walletWithHtlcLock);
        });
    });
});
