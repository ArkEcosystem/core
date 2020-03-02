import "jest-extended";

import { Enums, Utils } from "@arkecosystem/core-kernel";
import { StateBuilder } from "@arkecosystem/core-state/src/state-builder";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { Managers } from "@arkecosystem/crypto";
import { Sandbox } from "@packages/core-test-framework/src";

import { setUp, setUpDefaults } from "./setup";

let stateBuilder: StateBuilder;
let getBlockRewardsSpy: jest.SpyInstance;
let getSentTransactionSpy: jest.SpyInstance;
let getRegisteredHandlersSpy: jest.SpyInstance;
let dispatchSpy: jest.SpyInstance;

const getBlockRewardsDefault = setUpDefaults.getBlockRewards[0];
const getSentTransactionDefault = setUpDefaults.getSentTransaction[0];

const generatorKey = getBlockRewardsDefault.generatorPublicKey;
const senderKey = getSentTransactionDefault.senderPublicKey;

let sandbox: Sandbox;

let loggerWarningSpy: jest.SpyInstance;

let walletRepo: WalletRepository;
let restoreDefaultSentTransactions: () => void;

const saveDefaultTransactions = (): (() => void) => {
    const saveTransaction = setUpDefaults.getSentTransaction;
    return () => (setUpDefaults.getSentTransaction = saveTransaction);
};

beforeAll(async () => {
    const initialEnv = await setUp();

    walletRepo = initialEnv.walletRepo;
    stateBuilder = initialEnv.stateBuilder;
    sandbox = initialEnv.sandbox;

    getBlockRewardsSpy = initialEnv.spies.getBlockRewardsSpy;
    getSentTransactionSpy = initialEnv.spies.getSentTransactionSpy;
    getRegisteredHandlersSpy = initialEnv.spies.getRegisteredHandlersSpy;
    dispatchSpy = initialEnv.spies.dispatchSpy;
    loggerWarningSpy = initialEnv.spies.logger.warning;

    restoreDefaultSentTransactions = saveDefaultTransactions();
});

afterAll(() => jest.clearAllMocks());

describe("StateBuilder", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        walletRepo.reset();

        sandbox.app.config("crypto.exceptions.negativeBalances", {});

        restoreDefaultSentTransactions();

        // sender wallet balance should always be enough for default transactions (unless it is overridden)
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.make(100000);
    });

    it("should call block repository to get intial block rewards", async () => {
        await stateBuilder.run();

        expect(getBlockRewardsSpy).toHaveBeenCalled();
    });

    it("should get registered handlers", async () => {
        await stateBuilder.run();

        expect(getRegisteredHandlersSpy).toHaveBeenCalled();
    });

    it("should get sent transactions", async () => {
        await stateBuilder.run();

        expect(getSentTransactionSpy).toHaveBeenCalled();
    });

    it("should apply block rewards to generator wallet", async () => {
        const wallet = walletRepo.findByPublicKey(generatorKey);
        wallet.balance = Utils.BigNumber.ZERO;
        walletRepo.index(wallet);
        const expectedBalance = wallet.balance.plus(getBlockRewardsDefault.rewards);

        await stateBuilder.run();

        expect(wallet.balance).toEqual(expectedBalance);
    });

    it("should apply the transaction data to the sender", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.make(80000);
        walletRepo.index(wallet);

        const expectedBalance = wallet.balance
            .minus(getSentTransactionDefault.amount)
            .minus(getSentTransactionDefault.fee);

        await stateBuilder.run();

        expect(wallet.nonce).toEqual(getSentTransactionDefault.nonce);
        expect(wallet.balance).toEqual(expectedBalance);
    });

    it("should fail if any wallet balance is negative and not whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.make(-80000);
        wallet.publicKey = senderKey;

        walletRepo.index(wallet);

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith(
            "Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-135555'",
        );
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("should not fail for negative genesis wallet balances", async () => {
        const genesisPublicKeys: string[] = Managers.configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => [...acc, curr.senderPublicKey], []);

        const wallet = walletRepo.findByPublicKey(genesisPublicKeys[0]);
        wallet.balance = Utils.BigNumber.make(-80000);
        wallet.publicKey = genesisPublicKeys[0];

        walletRepo.index(wallet);

        await stateBuilder.run();

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });

    it("should not fail if the publicKey is whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.nonce = getSentTransactionDefault.nonce;
        const allowedWalletNegativeBalance = Utils.BigNumber.make(5555);
        wallet.balance = allowedWalletNegativeBalance;
        wallet.publicKey = senderKey;
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.nonce.toString()]: allowedWalletNegativeBalance.toString(),
            },
        };

        sandbox.app.config("crypto.exceptions.negativeBalances", balance);

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });

    it("should fail if the whitelisted key doesn't have the allowed negative balance", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.nonce = getSentTransactionDefault.nonce;
        wallet.balance = Utils.BigNumber.make(-90000);
        wallet.publicKey = senderKey;
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.nonce.toString()]: Utils.BigNumber.make(-80000).toString(),
            },
        };

        sandbox.app.config("crypto.exceptions.negativeBalances", balance);

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith(
            "Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-90000'",
        );
        expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("should emit an event when the builder is finished", async () => {
        await stateBuilder.run();

        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });

    it("should exit app if any vote balance is negative", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.ZERO;
        walletRepo.index(wallet);
        wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(-100));

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith(
            "Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative vote balance of '-100'",
        );
    });
});
