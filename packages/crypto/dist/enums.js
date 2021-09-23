"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["Transfer"] = 0] = "Transfer";
    TransactionType[TransactionType["SecondSignature"] = 1] = "SecondSignature";
    TransactionType[TransactionType["DelegateRegistration"] = 2] = "DelegateRegistration";
    TransactionType[TransactionType["Vote"] = 3] = "Vote";
    TransactionType[TransactionType["MultiSignature"] = 4] = "MultiSignature";
    TransactionType[TransactionType["Ipfs"] = 5] = "Ipfs";
    TransactionType[TransactionType["MultiPayment"] = 6] = "MultiPayment";
    TransactionType[TransactionType["DelegateResignation"] = 7] = "DelegateResignation";
    TransactionType[TransactionType["HtlcLock"] = 8] = "HtlcLock";
    TransactionType[TransactionType["HtlcClaim"] = 9] = "HtlcClaim";
    TransactionType[TransactionType["HtlcRefund"] = 10] = "HtlcRefund";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
var TransactionTypeGroup;
(function (TransactionTypeGroup) {
    TransactionTypeGroup[TransactionTypeGroup["Test"] = 0] = "Test";
    TransactionTypeGroup[TransactionTypeGroup["Core"] = 1] = "Core";
    // Everything above is available to anyone
    TransactionTypeGroup[TransactionTypeGroup["Reserved"] = 1000] = "Reserved";
})(TransactionTypeGroup = exports.TransactionTypeGroup || (exports.TransactionTypeGroup = {}));
var HtlcLockExpirationType;
(function (HtlcLockExpirationType) {
    HtlcLockExpirationType[HtlcLockExpirationType["EpochTimestamp"] = 1] = "EpochTimestamp";
    HtlcLockExpirationType[HtlcLockExpirationType["BlockHeight"] = 2] = "BlockHeight";
})(HtlcLockExpirationType = exports.HtlcLockExpirationType || (exports.HtlcLockExpirationType = {}));
//# sourceMappingURL=enums.js.map