import { CryptoSuite } from "@packages/core-crypto";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { TransactionFactory } from "@packages/core-test-framework/src/utils/transaction-factory";

export const dummy = {
    plainPassphrase: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
    bip38Passphrase: "6PYTQC4c2vBv6PGvV4HibNni6wNsHsGbR1qpL1DfkCNihsiWwXnjvJMU4B",
    publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    address: "ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo",
};

export const makeExpectedBlock = (cryptoSuite: CryptoSuite.CryptoSuite) => {
    return {
        version: 0,
        timestamp: 12345689,
        height: 3,
        previousBlockHex: "0000000000a98ac7",
        previousBlock: "11111111",
        numberOfTransactions: 50,
        totalAmount: cryptoSuite.CryptoManager.LibraryManager.Libraries.BigNumber.make(500),
        totalFee: cryptoSuite.CryptoManager.LibraryManager.Libraries.BigNumber.make(500000000),
        reward: cryptoSuite.CryptoManager.LibraryManager.Libraries.BigNumber.make(0),
        payloadLength: 1600,
        generatorPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    };
};

export const makeOptionsDefault = (cryptoSuite: CryptoSuite.CryptoSuite) => {
    return {
        timestamp: 12345689,
        previousBlock: {
            id: "11111111",
            idHex: "11111111",
            height: 2,
        },
        reward: cryptoSuite.CryptoManager.LibraryManager.Libraries.BigNumber.make(0),
    };
};

export const makeTransactions = (cryptoSuite: CryptoSuite.CryptoSuite) =>
    TransactionFactory.initialize(cryptoSuite)
        .transfer("DB4gFuDztmdGALMb8i1U4Z4R5SktxpNTAY", 10)
        .withPassphrase("super cool passphrase")
        .create(50);

export const makeDelegate = (cryptoSuite: CryptoSuite.CryptoSuite): BIP39 =>
    new BIP39(cryptoSuite.CryptoManager, cryptoSuite.BlockFactory, dummy.plainPassphrase);

export const getTimeStampForBlock = (height: number) => {
    switch (height) {
        case 1:
            return 0;
        default:
            throw new Error(`Test scenarios should not hit this line`);
    }
};

export const makeForgedBlockWithTransactions = (cryptoSuite: CryptoSuite.CryptoSuite) =>
    makeDelegate(cryptoSuite).forge(
        makeTransactions(cryptoSuite),
        makeOptionsDefault(cryptoSuite),
        getTimeStampForBlock,
    );
