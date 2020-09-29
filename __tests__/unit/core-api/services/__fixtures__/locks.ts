import { Utils as AppUtils } from "@packages/core-kernel";
import { Enums } from "@packages/crypto";

export const walletLockAttributes = {
    "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d": {
        amount: AppUtils.BigNumber.ONE,
        recipientId: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
        timestamp: 111180032,
        vendorField: undefined,
        expiration: {
            type: Enums.HtlcLockExpirationType.EpochTimestamp,
            value: 1111800392,
        },
        secretHash: "secretHash",
    },
};

export const lockResource = {
    amount: AppUtils.BigNumber.ONE,
    expirationType: 1,
    expirationValue: 1111800392,
    isExpired: false,
    lockId: "8816f8d8c257ea0c951deba911266394b0f2614df023f8b4ffd9da43d36efd9d",
    recipientId: "02275d8577a0ec2b75fc8683282d53c5db76ebc54514a80c2854e419b793ea259a",
    secretHash: "secretHash",
    senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
    timestamp: {
        epoch: 111180032,
        human: "2020-09-28T08:20:32.000Z",
        unix: 1601281232,
    },
    vendorField: undefined,
};
