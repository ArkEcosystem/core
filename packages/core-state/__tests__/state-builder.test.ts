import "jest-extended";

import { Enums, Utils } from "@packages/core-kernel";
import { StateBuilder } from "@packages/core-state/src/state-builder";
import { WalletRepository } from "@packages/core-state/src/wallets";
import { Sandbox } from "@packages/core-test-framework/src";
import { Managers } from "@packages/crypto";

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
let loggerInfoSpy: jest.SpyInstance;

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
    loggerInfoSpy = initialEnv.spies.logger.info;

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
        wallet.setBalance(Utils.BigNumber.make(100000));
    });

    it("should call block repository to get initial block rewards", async () => {
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
        wallet.setBalance(Utils.BigNumber.ZERO);
        walletRepo.index(wallet);
        const expectedBalance = wallet.getBalance().plus(getBlockRewardsDefault.rewards);

        await stateBuilder.run();

        expect(wallet.getBalance()).toEqual(expectedBalance);
    });

    it("should apply the transaction data to the sender", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setBalance(Utils.BigNumber.make(80000));
        walletRepo.index(wallet);

        const expectedBalance = wallet
            .getBalance()
            .minus(getSentTransactionDefault.amount)
            .minus(getSentTransactionDefault.fee);

        await stateBuilder.run();

        expect(wallet.getNonce()).toEqual(getSentTransactionDefault.nonce);
        expect(wallet.getBalance()).toEqual(expectedBalance);
    });

    it("should fail if any wallet balance is negative and not whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setBalance(Utils.BigNumber.make(-80000));
        wallet.setPublicKey(senderKey);

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
        wallet.setBalance(Utils.BigNumber.make(-80000));
        wallet.setPublicKey(genesisPublicKeys[0]);

        walletRepo.index(wallet);

        await stateBuilder.run();

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });

    it("should not fail if the publicKey is whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setNonce(getSentTransactionDefault.nonce);
        const allowedWalletNegativeBalance = Utils.BigNumber.make(5555);
        wallet.setBalance(allowedWalletNegativeBalance);
        wallet.setPublicKey(senderKey);
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.getNonce().toString()]: allowedWalletNegativeBalance.toString(),
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
        wallet.setNonce(getSentTransactionDefault.nonce);
        wallet.setBalance(Utils.BigNumber.make(-90000));
        wallet.setPublicKey(senderKey);
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.getNonce().toString()]: Utils.BigNumber.make(-80000).toString(),
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

    it("should not fail if the whitelisted key has the allowed negative balance", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setNonce(getSentTransactionDefault.nonce);
        wallet.setBalance(Utils.BigNumber.make(-90000));
        wallet.setPublicKey(senderKey);
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.getNonce().toString()]: Utils.BigNumber.make(-90000).toString(),
            },
        };

        sandbox.app.config("crypto.exceptions.negativeBalances", balance);

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalled();
    });

    it("should not fail if delegates vote balance isn't below 0", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setBalance(Utils.BigNumber.ZERO);
        walletRepo.index(wallet);
        wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(100));

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalled();
    });

    it("should fail if the wallet has no public key", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.setNonce(getSentTransactionDefault.nonce);
        wallet.setBalance(Utils.BigNumber.make(-90000));
        // @ts-ignore
        wallet.publicKey = undefined;
        walletRepo.index(wallet);

        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.getNonce().toString()]: Utils.BigNumber.make(-90000).toString(),
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
        wallet.setBalance(Utils.BigNumber.ZERO);
        walletRepo.index(wallet);
        wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(-100));

        setUpDefaults.getSentTransaction = [];

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith(
            "Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative vote balance of '-100'",
        );
    });

    it("should capitalise registered handlers", async () => {
        setUpDefaults.getRegisteredHandlers = [
            {
                getConstructor: () => ({
                    version: 1,
                    key: "test",
                }),
            },
        ];

        setUpDefaults.getSentTransaction = [];

        await expect(stateBuilder.run()).toResolve();

        expect(loggerInfoSpy).toHaveBeenNthCalledWith(3, `State Generation - Step 3 of 4: Test v1`);
    });
});
