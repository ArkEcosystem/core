import "jest-extended";

import { TransactionTypes } from "../../../../packages/crypto/src/enums";
import { configManager, feeManager } from "../../../../packages/crypto/src/managers";
import { devnet, mainnet } from "../../../../packages/crypto/src/networks";
import { Bignum } from "../../../../packages/crypto/src/utils";

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

        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(new Bignum(feesStatic.transfer));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(new Bignum(feesStatic.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            new Bignum(feesStatic.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(new Bignum(feesStatic.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(new Bignum(feesStatic.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(new Bignum(feesStatic.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(new Bignum(feesStatic.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(new Bignum(feesStatic.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            new Bignum(feesStatic.delegateResignation),
        );
    });

    it("should update fees on milestone change", () => {
        devnet.milestones.push({
            height: 100000000,
            fees: { staticFees: { transfer: 1234 } },
        } as any);

        configManager.setHeight(100000000);

        let { staticFees } = configManager.getMilestone().fees;
        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(new Bignum(1234));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(new Bignum(staticFees.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            new Bignum(staticFees.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(new Bignum(staticFees.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(new Bignum(staticFees.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(new Bignum(staticFees.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(new Bignum(staticFees.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(new Bignum(staticFees.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            new Bignum(staticFees.delegateResignation),
        );

        configManager.setHeight(1);
        staticFees = configManager.getMilestone().fees.staticFees;
        expect(feeManager.get(TransactionTypes.Transfer)).toEqual(new Bignum(staticFees.transfer));
        expect(feeManager.get(TransactionTypes.SecondSignature)).toEqual(new Bignum(staticFees.secondSignature));
        expect(feeManager.get(TransactionTypes.DelegateRegistration)).toEqual(
            new Bignum(staticFees.delegateRegistration),
        );
        expect(feeManager.get(TransactionTypes.Vote)).toEqual(new Bignum(staticFees.vote));
        expect(feeManager.get(TransactionTypes.MultiSignature)).toEqual(new Bignum(staticFees.multiSignature));
        expect(feeManager.get(TransactionTypes.Ipfs)).toEqual(new Bignum(staticFees.ipfs));
        expect(feeManager.get(TransactionTypes.TimelockTransfer)).toEqual(new Bignum(staticFees.timelockTransfer));
        expect(feeManager.get(TransactionTypes.MultiPayment)).toEqual(new Bignum(staticFees.multiPayment));
        expect(feeManager.get(TransactionTypes.DelegateResignation)).toEqual(
            new Bignum(staticFees.delegateResignation),
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
