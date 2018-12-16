import "jest-extended";
import network from "../../../crypto/src/networks/ark/testnet.json";
import { GenesisBlockBuilder } from "../../src/builder/genesis-block";

let builder;
let genesis;

beforeEach(() => {
    builder = new GenesisBlockBuilder(network, {
        totalPremine: 2100000000000000,
        activeDelegates: 2,
    });
});

describe("Genesis Block Builder", () => {
    describe("generate", () => {
        it("should return a genesis object", () => {
            genesis = builder.generate();

            expect(genesis).toContainAllKeys(["genesisBlock", "genesisWallet", "delegatePassphrases"]);
        });

        it("should call the expected methods", () => {
            builder.__createWallet = jest.fn(builder.__createWallet);
            builder.__buildDelegates = jest.fn(builder.__buildDelegates);
            builder.__buildDelegateTransactions = jest.fn(builder.__buildDelegateTransactions);
            builder.__createTransferTransaction = jest.fn(builder.__createTransferTransaction);
            builder.__createGenesisBlock = jest.fn(builder.__createGenesisBlock);

            builder.generate();

            expect(builder.__createWallet).toHaveBeenCalledTimes(4);
            expect(builder.__buildDelegates).toHaveBeenCalledTimes(1);
            expect(builder.__buildDelegateTransactions).toHaveBeenCalledTimes(1);
            expect(builder.__createTransferTransaction).toHaveBeenCalledTimes(1);
            expect(builder.__createGenesisBlock).toHaveBeenCalledTimes(1);
        });
    });
});
