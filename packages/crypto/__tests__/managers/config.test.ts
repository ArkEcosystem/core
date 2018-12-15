import "jest-extended";

import { TRANSACTION_TYPES } from "../../src/constants";
import { configManager } from "../../src/managers/config";
import { dynamicFeeManager } from "../../src/managers/dynamic-fee";
import { feeManager } from "../../src/managers/fee";
import { devnet, mainnet } from "../../src/networks/ark";

beforeEach(() => configManager.setConfig(devnet));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(configManager).toBeObject();
    });

    it("should be set on runtime", () => {
        configManager.setConfig(mainnet);

        expect(configManager.all()).toContainAllKeys([
            ...Object.keys(mainnet.network),
            ...["milestones", "dynamicFees"],
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

        expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(feesStatic.transfer);
        expect(feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(feesStatic.secondSignature);
        expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION)).toEqual(feesStatic.delegateRegistration);
        expect(feeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(feesStatic.vote);
        expect(feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(feesStatic.multiSignature);
        expect(feeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(feesStatic.ipfs);
        expect(feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(feesStatic.timelockTransfer);
        expect(feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(feesStatic.multiPayment);
        expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)).toEqual(feesStatic.delegateResignation);
    });

    it("should build dynamic fee offsets", () => {
        const addonBytes = devnet.dynamicFees.addonBytes;

        expect(dynamicFeeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(addonBytes.transfer);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(addonBytes.secondSignature);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION)).toEqual(addonBytes.delegateRegistration);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(addonBytes.vote);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(addonBytes.multiSignature);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(addonBytes.ipfs);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(addonBytes.timelockTransfer);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(addonBytes.multiPayment);
        expect(dynamicFeeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)).toEqual(addonBytes.delegateResignation);
    });

    it("should get milestone for height", () => {
        expect(configManager.getMilestone(21600)).toEqual(devnet.milestones[2]);
    });

    it("should set the height", () => {
        configManager.setHeight(21600);

        expect(configManager.getHeight()).toEqual(21600);
    });
});
