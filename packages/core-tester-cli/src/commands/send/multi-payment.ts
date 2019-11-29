import { Identities, Utils } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class MultiPaymentCommand extends SendCommand {
    public static description: string = "create wallets with multi signature";

    public static flags = {
        ...SendCommand.flagsSend,
        multipaymentFee: satoshiFlag({
            description: "multi payment fee",
            default: 0.1,
        }),
        recipients: flags.string({
            description: "public keys of recipients",
            default:
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
                "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
        }),
        amounts: flags.string({
            description: "amount to send to the recipients",
            default: "1000,2000,3000",
        }),
    };

    protected getCommand(): any {
        return MultiPaymentCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        const amountToTransfer =
            flags.multipaymentFee +
            (flags.amounts as string)
                .split(",")
                .map(amountStr => Utils.BigNumber.make(amountStr))
                .reduce((prev, curr) => prev.plus(curr), Utils.BigNumber.ZERO);

        return TransferCommand.run(
            [`--amount=${amountToTransfer}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const amounts = (flags.amounts as string).split(",");
        const recipients = (flags.recipients as string).split(",");
        const payments = amounts.map((amount, i) => ({ amount, recipientId: recipients[i] }));

        const transactions = [];

        for (const wallet of Object.values(wallets)) {
            const transaction = this.signer.makeMultipayment({
                ...flags,
                payments,
                passphrase: wallet.passphrase,
            });

            transactions.push(transaction);
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            for (const payment of transaction.asset.payments) {
                const currentBalance = await this.getWalletBalance(payment.recipientId);
                wallets[payment.recipientId].expectedBalance = currentBalance.plus(payment.amount);
            }

            const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
            const currentBalance = await this.getWalletBalance(senderId);
            wallets[senderId].expectedBalance = currentBalance.minus(transaction.fee).minus(transaction.amount);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                for (const payment of transaction.asset.payments) {
                    await this.knockBalance(payment.recipientId, wallets[payment.recipientId].expectedBalance);
                }

                const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
            }
        }
    }
}
