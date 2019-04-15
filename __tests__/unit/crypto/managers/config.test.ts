import { TransactionTypes } from "../../../../packages/crypto/src/enums";
import { configManager, feeManager } from "../../../../packages/crypto/src/managers";
import { devnet, mainnet } from "../../../../packages/crypto/src/networks";
import { BigNumber } from "../../../../packages/crypto/src/utils";

beforeEach(() => configManager.setConfig(devnet));

describe("Configuration", () => {
    it("should be instantiated", () => {
        expect(configManager).toBeObject();
    });

    it("should be set on runtime", () => {
        configManager.setConfig(mainnet);

        expect(configManager.all()).toContainAllKeys(["network", "milestones", "exceptions", "genesisBlock"]);
    });

    it('key should be "set"', () => {
        configManager.set("key", "value");

        expect(configManager.get("key")).toBe("value");
    });

    it('key should be "get"', () => {
        expect(configManager.get("network.nethash")).toBe(
            "2a44f340d76ffc3df204c5f38cd355b7496c9065a1ade2ef92071436bd72e867",
        );
    });

    it("should build milestones", () => {
        expect(configManager.getMilestones()).toEqual(devnet.milestones);
    });

    it("should build fees", () => {
        const feesStatic = devnet.milestones[0].fees.staticFees;

        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(BigNumber.make(feesStatic.transfer));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(BigNumber.make(feesStatic.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            BigNumber.make(feesStatic.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(BigNumber.make(feesStatic.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(BigNumber.make(feesStatic.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(BigNumber.make(feesStatic.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(BigNumber.make(feesStatic.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(BigNumber.make(feesStatic.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            BigNumber.make(feesStatic.delegateResignation),
        );
    });

    it("should update fees on milestone change", () => {
        devnet.milestones.push({
            height: 100000000,
            fees: { staticFees: { transfer: 1234 } },
        } as any);

        configManager.setHeight(100000000);

        let { staticFees } = configManager.getMilestone().fees;
        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(BigNumber.make(1234));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(BigNumber.make(staticFees.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            BigNumber.make(staticFees.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(BigNumber.make(staticFees.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(BigNumber.make(staticFees.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(BigNumber.make(staticFees.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(BigNumber.make(staticFees.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(BigNumber.make(staticFees.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            BigNumber.make(staticFees.delegateResignation),
        );

        configManager.setHeight(1);
        staticFees = configManager.getMilestone().fees.staticFees;
        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(BigNumber.make(staticFees.transfer));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(BigNumber.make(staticFees.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            BigNumber.make(staticFees.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(BigNumber.make(staticFees.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(BigNumber.make(staticFees.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(BigNumber.make(staticFees.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(BigNumber.make(staticFees.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(BigNumber.make(staticFees.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            BigNumber.make(staticFees.delegateResignation),
        );

        devnet.milestones.pop();
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
