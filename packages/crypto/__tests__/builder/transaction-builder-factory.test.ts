import "jest-extended";

import { DelegateRegistrationBuilder, DelegateResignationBuilder, IPFSBuilder, MultiPaymentBuilder,
    MultiSignatureBuilder, SecondSignatureBuilder, TimelockTransferBuilder, transactionBuilder as transactionBuilderFactory,
    TransactionBuilderFactory, TransferBuilder, VoteBuilder } from "../../dist/builder";

describe("Transaction Builder Factory", () => {
    it("should be instantiated", () => {
        expect(transactionBuilderFactory).toBeInstanceOf(TransactionBuilderFactory);
    });

    it('should create DelegateRegistrationBuilder', () => {
        expect(transactionBuilderFactory.delegateRegistration()).toBeInstanceOf(DelegateRegistrationBuilder);
    });

    it('should create DelegateResignationBuilder', () => {
        expect(transactionBuilderFactory.delegateResignation()).toBeInstanceOf(DelegateResignationBuilder);
    });

    it('should create IPFSBuilder', () => {
        expect(transactionBuilderFactory.ipfs()).toBeInstanceOf(IPFSBuilder);
    });

    it('should create MultiPaymentBuilder', () => {
        expect(transactionBuilderFactory.multiPayment()).toBeInstanceOf(MultiPaymentBuilder);
    });

    it('should create MultiSignatureBuilder', () => {
        expect(transactionBuilderFactory.multiSignature()).toBeInstanceOf(MultiSignatureBuilder);
    });

    it('should create SecondSignatureBuilder', () => {
        expect(transactionBuilderFactory.secondSignature()).toBeInstanceOf(SecondSignatureBuilder);
    });

    it('should create TimelockTransferBuilder', () => {
        expect(transactionBuilderFactory.timelockTransfer()).toBeInstanceOf(TimelockTransferBuilder);
    });

    it('should create TransferBuilder', () => {
        expect(transactionBuilderFactory.transfer()).toBeInstanceOf(TransferBuilder);
    });

    it('should create VoteBuilder', () => {
        expect(transactionBuilderFactory.vote()).toBeInstanceOf(VoteBuilder);
    });
});
