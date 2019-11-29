/* tslint:disable:max-line-length no-empty */
import { State } from "@arkecosystem/core-interfaces";
import { Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                switch (name) {
                    case "database":
                        return {
                            walletManager,
                        };
                    default:
                        return {};
                }
            },
        },
    };
});

let walletManager: State.IWalletManager;

beforeAll(() => {
    Managers.configManager.setFromPreset("unitnet");
});

describe("Wallet Manager", () => {
    describe("Multipayment", () => {
        const senderPassphrase = "craft imitate step mixture patch forest volcano business charge around girl confirm";
        const senderKeys = Identities.Keys.fromPassphrase(senderPassphrase);
        const recipientsPassphrases = [
            "fatal hat",
            "sail asset",
            "chase barrel",
            "pluck bag",
            "approve coral",
            "slab bright",
        ];
        const recipientsKeys = recipientsPassphrases.map(p => Identities.Keys.fromPassphrase(p));

        let senderWallet;
        let recipientsWallets;

        const initialSenderWalletBalance = Utils.BigNumber.make(45 * 1e8);
        const initialDelegateWalletBalance = Utils.BigNumber.make(1000 * 1e8);

        beforeEach(() => {
            walletManager = new WalletManager();

            senderWallet = new Wallet(Identities.Address.fromPublicKey(senderKeys.publicKey));
            senderWallet.publicKey = senderKeys.publicKey;
            senderWallet.balance = initialSenderWalletBalance;
            walletManager.reindex(senderWallet);

            recipientsWallets = recipientsKeys.map(k => {
                const address = Identities.Address.fromPublicKey(k.publicKey);
                const wallet = new Wallet(address);
                wallet.publicKey = k.publicKey;
                wallet.address = address;
                walletManager.reindex(wallet);
                return wallet;
            });
        });

        describe("apply and revert transaction", () => {
            it("should update balance and vote balance when sender wallet votes for a delegate", async () => {
                // sender wallet will vote for a delegate and we will check vote balance
                const delegateKeys = Identities.Keys.fromPassphrase("delegate");
                const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
                delegate.setAttribute("delegate.username", "unittest");
                delegate.balance = initialDelegateWalletBalance;
                delegate.setAttribute("vote", delegate.publicKey);
                delegate.setAttribute("delegate.voteBalance", delegate.balance);
                walletManager.reindex(delegate);

                const voteTransaction = Transactions.BuilderFactory.vote()
                    .votesAsset([`+${delegateKeys.publicKey}`])
                    .fee("125")
                    .nonce("1")
                    .sign(senderPassphrase)
                    .build();

                expect(senderWallet.balance).toEqual(initialSenderWalletBalance);
                recipientsWallets.map(w => expect(w.balance).toEqual(Utils.BigNumber.ZERO));
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(initialDelegateWalletBalance);

                // apply vote
                await walletManager.applyTransaction(voteTransaction);

                const expectBeforeMultiPayment = () => {
                    expect(senderWallet.balance).toEqual(initialSenderWalletBalance.minus(voteTransaction.data.fee));
                    recipientsWallets.map(w => expect(w.balance).toEqual(Utils.BigNumber.ZERO));
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(senderWallet.balance),
                    );
                };
                expectBeforeMultiPayment();

                const multiPaymentFee = "125000";
                const multiPaymentAmount = "10";
                const multipaymentBuilder = Transactions.BuilderFactory.multiPayment()
                    .fee(multiPaymentFee)
                    .nonce("2");
                for (const w of recipientsWallets) {
                    multipaymentBuilder.addPayment(w.address, multiPaymentAmount);
                }
                const multipaymentTransaction = multipaymentBuilder.sign(senderPassphrase).build();

                await walletManager.applyTransaction(multipaymentTransaction);

                expect(senderWallet.balance).toEqual(
                    initialSenderWalletBalance
                        .minus(voteTransaction.data.fee)
                        .minus(+multiPaymentAmount * recipientsWallets.length)
                        .minus(multiPaymentFee),
                );
                recipientsWallets.map(w => expect(w.balance).toEqual(Utils.BigNumber.make(multiPaymentAmount)));
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                    initialDelegateWalletBalance.plus(senderWallet.balance),
                );

                await walletManager.revertTransaction(multipaymentTransaction);
                expectBeforeMultiPayment();
            });

            it("should update balance and vote balance when recipients wallets vote for a delegate", async () => {
                // recipients wallets will vote for a delegate and we will check vote balance
                const delegateKeys = Identities.Keys.fromPassphrase("delegate");
                const delegate = walletManager.findByPublicKey(delegateKeys.publicKey);
                delegate.setAttribute("delegate.username", "unittest");
                delegate.balance = initialDelegateWalletBalance;
                delegate.setAttribute("vote", delegate.publicKey);
                delegate.setAttribute("delegate.voteBalance", delegate.balance);
                walletManager.reindex(delegate);

                const initialRecipientsBalance = Utils.BigNumber.make(123 * 1e8);
                recipientsWallets.map(w => (w.balance = initialRecipientsBalance));

                expect(senderWallet.balance).toEqual(initialSenderWalletBalance);
                recipientsWallets.map(w => expect(w.balance).toEqual(initialRecipientsBalance));
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(initialDelegateWalletBalance);

                // apply vote
                const voteTransactionFee = "125";
                for (const passphrase of recipientsPassphrases) {
                    const voteTransaction = Transactions.BuilderFactory.vote()
                        .votesAsset([`+${delegateKeys.publicKey}`])
                        .fee(voteTransactionFee)
                        .sign(passphrase)
                        .nonce("1")
                        .build();

                    await walletManager.applyTransaction(voteTransaction);
                }

                const expectBeforeMultiPayment = () => {
                    expect(senderWallet.balance).toEqual(initialSenderWalletBalance);
                    recipientsWallets.map(w =>
                        expect(w.balance).toEqual(initialRecipientsBalance.minus(voteTransactionFee)),
                    );
                    expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                    expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                        initialDelegateWalletBalance.plus(
                            recipientsWallets.reduce((prev, curr) => prev.plus(curr.balance), Utils.BigNumber.ZERO),
                        ),
                    );
                };
                expectBeforeMultiPayment();

                const multiPaymentFee = "125000";
                const multiPaymentAmount = "10";
                const multipaymentBuilder = Transactions.BuilderFactory.multiPayment()
                    .fee(multiPaymentFee)
                    .nonce("1");
                for (const w of recipientsWallets) {
                    multipaymentBuilder.addPayment(w.address, multiPaymentAmount);
                }
                const multipaymentTransaction = multipaymentBuilder.sign(senderPassphrase).build();

                await walletManager.applyTransaction(multipaymentTransaction);

                expect(senderWallet.balance).toEqual(
                    initialSenderWalletBalance
                        .minus(+multiPaymentAmount * recipientsWallets.length)
                        .minus(multiPaymentFee),
                );
                recipientsWallets.map(w =>
                    expect(w.balance).toEqual(
                        initialRecipientsBalance.minus(voteTransactionFee).plus(multiPaymentAmount),
                    ),
                );
                expect(delegate.balance).toEqual(initialDelegateWalletBalance);
                expect(delegate.getAttribute("delegate.voteBalance")).toEqual(
                    initialDelegateWalletBalance.plus(
                        recipientsWallets.reduce((prev, curr) => prev.plus(curr.balance), Utils.BigNumber.ZERO),
                    ),
                );

                await walletManager.revertTransaction(multipaymentTransaction);
                expectBeforeMultiPayment();
            });
        });
    });
});
