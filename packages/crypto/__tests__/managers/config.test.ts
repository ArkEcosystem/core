import "jest-extended";

import { TRANSACTION_TYPES } from "../../src/constants";
import { configManager } from "../../src/managers/config";
import { dynamicFeeManager } from "../../src/managers/dynamic-fee";
import { feeManager } from "../../src/managers/fee";
import network from "../../src/networks/ark/devnet.json";
import networkMainnet from "../../src/networks/ark/mainnet.json";

beforeEach(() => configManager.setConfig(network));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(configManager).toBeObject();
    });

    it("should be set on runtime", () => {
        configManager.setConfig(networkMainnet);

        expect(configManager.all()).toEqual(networkMainnet);
    });

    it('key should be "set"', () => {
        configManager.set("key", "value");

        expect(configManager.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(configManager.get("nethash")).toBe("2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867");
    });

    it("should build constants", () => {
        expect(configManager.constants).toEqual(network.constants);
    });

    it("should build fees", () => {
        const fees = network.constants[0].fees.staticFees;

        expect(feeManager.get(TRANSACTION_TYPES.TRANSFER)).toEqual(fees.transfer);
        expect(feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)).toEqual(fees.secondSignature);
        expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_REGISTRATION)).toEqual(fees.delegateRegistration);
        expect(feeManager.get(TRANSACTION_TYPES.VOTE)).toEqual(fees.vote);
        expect(feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)).toEqual(fees.multiSignature);
        expect(feeManager.get(TRANSACTION_TYPES.IPFS)).toEqual(fees.ipfs);
        expect(feeManager.get(TRANSACTION_TYPES.TIMELOCK_TRANSFER)).toEqual(fees.timelockTransfer);
        expect(feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT)).toEqual(fees.multiPayment);
        expect(feeManager.get(TRANSACTION_TYPES.DELEGATE_RESIGNATION)).toEqual(fees.delegateResignation);
    });

    it("should build dynamic fee offsets", () => {
        const addonBytes = network.constants[0].fees.dynamicFees.addonBytes;

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

    it("should get constants for height", () => {
        expect(configManager.getConstants(21600)).toEqual(network.constants[2]);
    });

    it("should set the height", () => {
        configManager.setHeight(21600);

        expect(configManager.getHeight()).toEqual(21600);
    });
});
