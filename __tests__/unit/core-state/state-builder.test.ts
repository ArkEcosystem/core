import "jest-extended";

import { setUp, setUpDefaults } from "./setup";
import { StateBuilder } from "@arkecosystem/core-state/src/state-builder";
import { Enums, Utils } from "@arkecosystem/core-kernel";
import { WalletRepository } from "@arkecosystem/core-state/src/wallets";
import { Sandbox } from "@packages/core-test-framework/src";
import { Managers } from "@arkecosystem/crypto";

let stateBuilder: StateBuilder;
let getBlockRewardsSpy: jest.SpyInstance;
let getSentTransactionSpy: jest.SpyInstance;
let getRegisteredHandlersSpy: jest.SpyInstance;
let dispatchSpy: jest.SpyInstance;
const generatorKey = setUpDefaults.getBlockRewards.generatorPublicKey;
const senderKey = setUpDefaults.getSentTransaction.senderPublicKey;

let sandbox: Sandbox;

let loggerWarningSpy: jest.SpyInstance;

let walletRepo: WalletRepository;

beforeAll(async () => {
    const initialEnv = setUp();

    walletRepo = initialEnv.walletRepo;
    stateBuilder = initialEnv.stateBuilder;
    sandbox = initialEnv.sandbox;

    getBlockRewardsSpy = initialEnv.spies.getBlockRewardsSpy;
    getSentTransactionSpy = initialEnv.spies.getSentTransactionSpy;
    getRegisteredHandlersSpy = initialEnv.spies.getRegisteredHandlersSpy;
    dispatchSpy = initialEnv.spies.dispatchSpy;
    loggerWarningSpy = initialEnv.spies.logger.warning;
});

describe("StateBuilder", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        walletRepo.reset();
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
        walletRepo.reindex(wallet);
        const expectedBalance = wallet.balance.plus(setUpDefaults.getBlockRewards.rewards);
        
        await stateBuilder.run();

        expect(wallet.balance).toEqual(expectedBalance);
    });

    it("should apply the transaction data to the sender", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.make(80000);
        walletRepo.reindex(wallet);

        const expectedBalance = wallet.balance.minus(setUpDefaults.getSentTransaction.amount).minus(setUpDefaults.getSentTransaction.fee);

        await stateBuilder.run();
                
        expect(wallet.nonce).toEqual(Utils.BigNumber.make(setUpDefaults.getSentTransaction.nonce));
        expect(wallet.balance).toEqual(expectedBalance);
    });

    // TODO: this tests fails, but presumably should pass?
    it("should exit app if any wallet balance is negative and not whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.make(-80000);
        wallet.publicKey = senderKey;

        walletRepo.reindex(wallet);

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith("Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-80000'");
    });

    it("should not fail for negative genesis wallet balances", async () => {
        const genesisPublicKeys: string[] = Managers.configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => [...acc, curr.senderPublicKey], []);
        const wallet = walletRepo.findByPublicKey(genesisPublicKeys[0]);
        wallet.balance = Utils.BigNumber.make(-80000);
        wallet.publicKey = genesisPublicKeys[0];

        walletRepo.reindex(wallet);

        expect.assertions(2);
        await stateBuilder.run().then(() => expect("not called").toEqual("not called"));
        expect(loggerWarningSpy).not.toHaveBeenCalled();
    });

    it("should not fail if the publicKey is whitelisted", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.nonce = Utils.BigNumber.make(-80000)
        const allowedWalletNegativeBalance = Utils.BigNumber.make(-50000);
        wallet.balance = allowedWalletNegativeBalance;
        wallet.publicKey = senderKey;
        
        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.nonce.toString()]: allowedWalletNegativeBalance.toString()
            }
        }

        sandbox.app.config(
            "exceptions.negativeBalances",
            balance,
        );

        expect.assertions(2);
        await stateBuilder.run().then(() => expect("not called").toEqual("not called"));
        expect(loggerWarningSpy).not.toHaveBeenCalled();
    });

    // TODO: check that this should be passing?
    it("should fail if the whitelisted key doesn't have the allowed negative balance", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.nonce = Utils.BigNumber.make(-80000)
        wallet.balance = Utils.BigNumber.make(-50000);
        wallet.publicKey = senderKey;
        
        const balance: Record<string, Record<string, string>> = {
            [senderKey]: {
                [wallet.nonce.toString()]: Utils.BigNumber.make(-80000).toString()
            }
        }

        sandbox.app.config(
            "exceptions.negativeBalances",
            balance,
        );

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith("Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative balance of '-80000'")
    });

    it("should emit an event when the builder is finished", async () => {
        await stateBuilder.run();

        expect(dispatchSpy).toHaveBeenCalledWith(Enums.StateEvent.BuilderFinished);
    });

    it("should exit app if any vote balance is negative", async () => {
        const wallet = walletRepo.findByPublicKey(senderKey);
        wallet.balance = Utils.BigNumber.ZERO;
        walletRepo.reindex(wallet);
        wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(-100));

        await stateBuilder.run();

        expect(loggerWarningSpy).toHaveBeenCalledWith("Wallet ATtEq2tqNumWgR9q9zF6FjGp34Mp5JpKGp has a negative vote balance of '-100'")
    });
});