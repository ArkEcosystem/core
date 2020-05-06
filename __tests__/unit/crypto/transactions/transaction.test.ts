import "jest-extended";

import { CryptoManager, Interfaces, Transactions } from "../../../../packages/crypto/src";
import { devnet } from "../../../../packages/crypto/src/networks";
import { Two } from "../../../../packages/crypto/src/transactions/types";
import { buildDevnetTxs, buildMainnetTxs } from "./__fixtures__/transaction";

let cryptoManagerMainnet: CryptoManager<any>;
let transactionManagerMainnet: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;
let cryptoManagerDevnet: CryptoManager<any>;
let transactionManagerDevnet: Transactions.TransactionsManager<any, Interfaces.ITransactionData, any>;

describe("Transaction", () => {
    beforeAll(() => {
        cryptoManagerMainnet = CryptoManager.createFromPreset("mainnet");
        transactionManagerMainnet = new Transactions.TransactionsManager(cryptoManagerMainnet, {
            extendTransaction: () => {},
            // @ts-ignore
            validate: (_, data) => ({
                value: data,
            }),
        });

        cryptoManagerDevnet = CryptoManager.createFromPreset("mainnet");
        transactionManagerDevnet = new Transactions.TransactionsManager(cryptoManagerDevnet, {
            extendTransaction: () => {},
            // @ts-ignore
            validate: (_, data) => ({
                value: data,
            }),
        });
    });
    describe("should deserialize correctly some tests transactions", () => {
        let mainnetTxs;
        let devnetTxs;

        beforeAll(() => {
            mainnetTxs = buildMainnetTxs(cryptoManagerMainnet.LibraryManager.Libraries.BigNumber);
            devnetTxs = buildDevnetTxs(cryptoManagerDevnet.LibraryManager.Libraries.BigNumber);
        });

        it("mainnet", () => {
            for (const tx of mainnetTxs) {
                const newtx = transactionManagerMainnet.TransactionFactory.fromData(tx);
                expect(newtx.data.id).toEqual(tx.id);
            }
        });

        it("devnet", () => {
            for (const tx of devnetTxs) {
                const newtx = transactionManagerDevnet.TransactionFactory.fromData(tx);
                expect(newtx.data.id).toEqual(tx.id);
            }
        });
    });

    describe("static fees", () => {
        it("should update fees on milestone change", () => {
            const milestones = devnet.milestones;
            milestones.push({
                height: 100000000,
                // @ts-ignore
                fees: { staticFees: { transfer: 1234 } },
            });

            const crypto = CryptoManager.createFromConfig({ ...devnet, milestones });

            crypto.HeightTracker.setHeight(100000000);

            let { staticFees } = crypto.MilestoneManager.getMilestone().fees;
            expect(Two.TransferTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(1234),
            );
            expect(Two.SecondSignatureRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.secondSignature),
            );
            expect(Two.DelegateRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.delegateRegistration),
            );
            expect(Two.VoteTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.vote),
            );
            expect(Two.MultiSignatureRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.multiSignature),
            );
            expect(Two.IpfsTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.ipfs),
            );
            expect(Two.MultiPaymentTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.multiPayment),
            );
            expect(Two.DelegateResignationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.delegateResignation),
            );

            crypto.HeightTracker.setHeight(1);
            staticFees = crypto.MilestoneManager.getMilestone().fees.staticFees;

            expect(Two.TransferTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.transfer),
            );
            expect(Two.SecondSignatureRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.secondSignature),
            );
            expect(Two.DelegateRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.delegateRegistration),
            );
            expect(Two.VoteTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.vote),
            );
            expect(Two.MultiSignatureRegistrationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.multiSignature),
            );
            expect(Two.IpfsTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.ipfs),
            );
            expect(Two.MultiPaymentTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.multiPayment),
            );
            expect(Two.DelegateResignationTransaction.staticFee(crypto)).toEqual(
                crypto.LibraryManager.Libraries.BigNumber.make(staticFees.delegateResignation),
            );

            devnet.milestones.pop();
        });
    });

    describe("toString", () => {
        it("should describe v1 transaction", () => {
            cryptoManagerMainnet.MilestoneManager.getMilestone().aip11 = false;

            const senderAddress = cryptoManagerMainnet.Identities.Address.fromPassphrase("sender's secret");
            const recipientAddress = cryptoManagerMainnet.Identities.Address.fromPassphrase("recipient's secret");
            const transaction = transactionManagerMainnet.BuilderFactory.transfer()
                .version(1)
                .amount("100")
                .recipientId(recipientAddress)
                .sign("sender's secret")
                .build();

            expect(String(transaction)).toMatch(new RegExp(`^${senderAddress} [0-9a-f]{8} Transfer v1$`));
        });

        it("should describe v2 transaction", () => {
            cryptoManagerMainnet.MilestoneManager.getMilestone().aip11 = true;

            const senderAddress = cryptoManagerMainnet.Identities.Address.fromPassphrase("sender's secret");
            const recipientAddress = cryptoManagerMainnet.Identities.Address.fromPassphrase("recipient's secret");
            const transaction = transactionManagerMainnet.BuilderFactory.transfer()
                .version(2)
                .amount("100")
                .recipientId(recipientAddress)
                .nonce("1")
                .sign("sender's secret")
                .build();

            expect(String(transaction)).toMatch(new RegExp(`^${senderAddress}#1 [0-9a-f]{8} Transfer v2$`));
        });
    });
});
