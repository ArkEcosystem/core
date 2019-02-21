import { Blockchain, Container, Database } from "@arkecosystem/core-interfaces";
import { generators } from "@arkecosystem/core-test-utils";
import { delegates, genesisBlock, wallets } from "@arkecosystem/core-test-utils/src/fixtures/unitnet";
import { crypto, models } from "@arkecosystem/crypto";
import bip39 from "bip39";
import { setUpFull, tearDownFull } from "./__support__/setup";

const { Block } = models;
const { generateTransfers, generateWallets, generateDelegateRegistration, generateVote } = generators;

const satoshi = 10 ** 8;
let container: Container.IContainer;
let PoolWalletManager;
let poolWalletManager;
let blockchain: Blockchain.IBlockchain;

beforeAll(async () => {
    container = await setUpFull();

    PoolWalletManager = require("../src").PoolWalletManager;
    poolWalletManager = new PoolWalletManager();
    blockchain = container.resolvePlugin<Blockchain.IBlockchain>("blockchain");
});

afterAll(async () => {
    await tearDownFull();
});

describe("canApply", () => {
    it("should add an error for delegate registration when username is already taken", () => {
        const delegateReg = generateDelegateRegistration("unitnet", wallets[11].passphrase, 1, false, "genesis_11")[0];
        const errors = [];

        expect(poolWalletManager.canApply(delegateReg, errors)).toBeFalse();
        expect(errors).toEqual([`Can't apply transaction ${delegateReg.id}: delegate name already taken.`]);
    });

    it("should add an error when voting for a delegate that doesn't exist", () => {
        const vote = generateVote("unitnet", wallets[11].passphrase, wallets[12].keys.publicKey, 1)[0];
        const errors = [];

        expect(poolWalletManager.canApply(vote, errors)).toBeFalse();
        expect(errors).toEqual([
            `Can't apply transaction ${vote.id}: delegate +${wallets[12].keys.publicKey} does not exist.`,
        ]);
    });
});

describe("applyPoolTransactionToSender", () => {
    describe("update the balance", () => {
        it("should only update the balance of the sender", async () => {
            const delegate0 = delegates[0];
            const { publicKey } = crypto.getKeys(bip39.generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = poolWalletManager.findByAddress(delegate0.address);
            const newWallet = poolWalletManager.findByAddress(newAddress);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const transfer = generateTransfers("unitnet", delegate0.secret, newAddress, amount1, 1)[0];

            delegateWallet.applyTransactionToSender(transfer);

            expect(+delegateWallet.balance).toBe(+delegate0.balance - amount1 - 0.1 * 10 ** 8);
            expect(newWallet.balance.isZero()).toBeTrue();
        });

        it("should only update the balance of the sender with dyn fees", async () => {
            const delegate0 = delegates[1];
            const { publicKey } = crypto.getKeys(bip39.generateMnemonic());
            const newAddress = crypto.getAddress(publicKey);

            const delegateWallet = poolWalletManager.findByAddress(delegate0.address);
            const newWallet = poolWalletManager.findByAddress(newAddress);

            expect(+delegateWallet.balance).toBe(+delegate0.balance);
            expect(+newWallet.balance).toBe(0);

            const amount1 = 123 * 10 ** 8;
            const fee = 10;
            const transfer = generateTransfers("unitnet", delegate0.secret, newAddress, amount1, 1, false, fee)[0];

            delegateWallet.applyTransactionToSender(transfer);

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
                const transfer = generateTransfers("unitnet", t.from.passphrase, t.to.address, t.amount, 1)[0];

                // This is normally refused because it's a cold wallet, but since we want
                // to test if chained transfers are refused, pretent it is not a cold wallet.
                container
                    .resolvePlugin<Database.IDatabaseService>("database")
                    .walletManager.findByPublicKey(transfer.data.senderPublicKey);

                const errors = [];
                if (poolWalletManager.canApply(transfer, errors)) {
                    poolWalletManager.findByPublicKey(transfer.data.senderPublicKey).applyTransactionToSender(transfer);

                    expect(t.from).toBe(delegate);
                } else {
                    expect(t.from).toBe(walletsGen[0]);
                    expect(JSON.stringify(errors)).toEqual(
                        `["[PoolWalletManager] Can't apply transaction id:${transfer.id} from sender:${
                            t.from.address
                        }","Insufficient balance in the wallet."]`,
                    );
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
        const transfer = generateTransfers(
            "unitnet",
            transferDelegate.passphrase,
            wallet.address,
            transferAmount,
            1,
            true,
        )[0];

        const totalFee = 0.1 * satoshi;
        const blockWithReward = {
            id: "17882607875259085966",
            version: 0,
            timestamp: 46583330,
            height: 2,
            reward,
            previousBlock: genesisBlock.id,
            numberOfTransactions: 1,
            transactions: [transfer],
            totalAmount: transfer.amount,
            totalFee,
            payloadLength: 0,
            payloadHash: genesisBlock.payloadHash,
            generatorPublicKey,
            blockSignature:
                "3045022100e7385c6ea42bd950f7f6ab8c8619cf2f66a41d8f8f185b0bc99af032cb25f30d02200b6210176a6cedfdcbe483167fd91c21d740e0e4011d24d679c601fdd46b0de9",
            createdAt: "2019-07-11T16:48:50.550Z",
        };
        const blockWithRewardVerified = new Block(blockWithReward);
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
