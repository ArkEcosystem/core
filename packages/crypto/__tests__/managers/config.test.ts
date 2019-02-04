import "jest-extended";

import { TransactionTypes } from "../../src/constants";
import { configManager } from "../../src/managers/config";
import { feeManager } from "../../src/managers/fee";
import { devnet, mainnet } from "../../src/networks";

beforeEach(() => configManager.setConfig(devnet));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(configManager).toBeObject();
    });

    it("should be set on runtime", () => {
        configManager.setConfig(mainnet);

        expect(configManager.all()).toContainAllKeys([
            ...Object.keys(mainnet.network),
            ...["milestones", "exceptions", "genesisBlock"],
        ]);
    });

    it('key should be "set"', () => {
        configManager.set("key", "value");

        expect(configManager.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(configManager.get("nethash")).toBe("2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867");
    });

    it("should build milestones", () => {
        expect(configManager.milestones).toEqual(devnet.milestones);
    });

    it("should build fees", () => {
        const feesStatic = devnet.milestones[0].fees.staticFees;

        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(feesStatic.transfer);
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(feesStatic.secondSignature);
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(feesStatic.delegateRegistration);
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(feesStatic.vote);
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(feesStatic.multiSignature);
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(feesStatic.ipfs);
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(feesStatic.timelockTransfer);
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(feesStatic.multiPayment);
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(feesStatic.delegateResignation);
    });

    it("should get milestone for height", () => {
        expect(configManager.getMilestone(21600)).toEqual(devnet.milestones[2]);
    });

    it("should get milestone for this.height if height is not provided as parameter", () => {
        configManager.setHeight(21600);
        expect(configManager.getMilestone()).toEqual(devnet.milestones[2]);
    });

    it("should set the height", () => {
        configManager.setHeight(21600);

        expect(configManager.getHeight()).toEqual(21600);
    });
});
