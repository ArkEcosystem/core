import "jest-extended";

import { DelegateRegistrationBuilder } from "../../../../packages/crypto/src/builder/transactions/delegate-registration";
import { DelegateResignationBuilder } from "../../../../packages/crypto/src/builder/transactions/delegate-resignation";
import { IPFSBuilder } from "../../../../packages/crypto/src/builder/transactions/ipfs";
import { MultiPaymentBuilder } from "../../../../packages/crypto/src/builder/transactions/multi-payment";
import { MultiSignatureBuilder } from "../../../../packages/crypto/src/builder/transactions/multi-signature";
import { SecondSignatureBuilder } from "../../../../packages/crypto/src/builder/transactions/second-signature";
import { TimelockTransferBuilder } from "../../../../packages/crypto/src/builder/transactions/timelock-transfer";
import { TransferBuilder } from "../../../../packages/crypto/src/builder/transactions/transfer";
import { VoteBuilder } from "../../../../packages/crypto/src/builder/transactions/vote";

import { transactionBuilder, TransactionBuilderFactory } from "../../../../packages/crypto/src/builder";

describe("Transaction Builder Factory", () => {
    it("should be instantiated", () => {
        expect(transactionBuilder).toBeInstanceOf(TransactionBuilderFactory);
    });

    it("should create DelegateRegistrationBuilder", () => {
        expect(transactionBuilder.delegateRegistration()).toBeInstanceOf(DelegateRegistrationBuilder);
    });

    it("should create DelegateResignationBuilder", () => {
        expect(transactionBuilder.delegateResignation()).toBeInstanceOf(DelegateResignationBuilder);
    });

    it("should create IPFSBuilder", () => {
        expect(transactionBuilder.ipfs()).toBeInstanceOf(IPFSBuilder);
    });

    it("should create MultiPaymentBuilder", () => {
        expect(transactionBuilder.multiPayment()).toBeInstanceOf(MultiPaymentBuilder);
    });

    it("should create MultiSignatureBuilder", () => {
        expect(transactionBuilder.multiSignature()).toBeInstanceOf(MultiSignatureBuilder);
    });

    it("should create SecondSignatureBuilder", () => {
        expect(transactionBuilder.secondSignature()).toBeInstanceOf(SecondSignatureBuilder);
    });

    it("should create TimelockTransferBuilder", () => {
        expect(transactionBuilder.timelockTransfer()).toBeInstanceOf(TimelockTransferBuilder);
    });

    it("should create TransferBuilder", () => {
        expect(transactionBuilder.transfer()).toBeInstanceOf(TransferBuilder);
    });

    it("should create VoteBuilder", () => {
        expect(transactionBuilder.vote()).toBeInstanceOf(VoteBuilder);
    });
});
