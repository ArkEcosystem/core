import "jest-extended";

import { BuilderFactory } from "../../../../../packages/crypto/src/transactions";
import { DelegateRegistrationBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/delegate-registration";
import { DelegateResignationBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/delegate-resignation";
import { IPFSBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/ipfs";
import { MultiPaymentBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/multi-payment";
import { MultiSignatureBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/multi-signature";
import { SecondSignatureBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/second-signature";
import { TransferBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/transfer";
import { VoteBuilder } from "../../../../../packages/crypto/src/transactions/builders/transactions/vote";

describe("Builder Factory", () => {
    it("should create DelegateRegistrationBuilder", () => {
        expect(BuilderFactory.delegateRegistration()).toBeInstanceOf(DelegateRegistrationBuilder);
    });

    it("should create DelegateResignationBuilder", () => {
        expect(BuilderFactory.delegateResignation()).toBeInstanceOf(DelegateResignationBuilder);
    });

    it("should create IPFSBuilder", () => {
        expect(BuilderFactory.ipfs()).toBeInstanceOf(IPFSBuilder);
    });

    it("should create MultiPaymentBuilder", () => {
        expect(BuilderFactory.multiPayment()).toBeInstanceOf(MultiPaymentBuilder);
    });

    it("should create MultiSignatureBuilder", () => {
        expect(BuilderFactory.multiSignature()).toBeInstanceOf(MultiSignatureBuilder);
    });

    it("should create SecondSignatureBuilder", () => {
        expect(BuilderFactory.secondSignature()).toBeInstanceOf(SecondSignatureBuilder);
    });

    it("should create TransferBuilder", () => {
        expect(BuilderFactory.transfer()).toBeInstanceOf(TransferBuilder);
    });

    it("should create VoteBuilder", () => {
        expect(BuilderFactory.vote()).toBeInstanceOf(VoteBuilder);
    });
});
