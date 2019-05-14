import { Identities } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class MultiSignatureRegistrationCommand extends SendCommand {
    public static description: string = "create wallets with multi signature";

    public static flags = {
        ...SendCommand.flagsSend,
        multiSignatureFee: satoshiFlag({
            description: "multi signature fee",
            default: 25,
        }),
        participants: flags.string({
            description: "public keys of multi signature participants",
            default:
                "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37," +
                "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d," +
                "0290907d441d257334c4376126d6cbf37cd7993ca2d0cc58850b30b869d4bf4c3e",
        }),
        passphrases: flags.string({
            description: "passphrases of participants used for signing",
            default:
                "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire," +
                "venue below waste gather spin cruise title still boost mother flash tuna," +
                "craft imitate step mixture patch forest volcano business charge around girl confir",
        }),
        min: flags.integer({
            description: "minimum number of participants required",
            default: 3,
        }),
    };

    protected getCommand(): any {
        return MultiSignatureRegistrationCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.multiSignatureFee}`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];
        for (const [address, wallet] of Object.entries(wallets)) {
            const transaction = this.signer.makeMultiSignatureRegistration({
                ...flags,
                ...{
                    passphrase: wallet.passphrase,
                    secondPassphrase: wallet.passphrase,
                },
            });

            wallets[address].publicKey = transaction.senderPublicKey;
            transactions.push(transaction);
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
                await this.knockSignature(recipientId, wallets[recipientId].secondPublicKey);
            }
        }
    }

    private async knockSignature(address: string, expected: string): Promise<void> {
        const { secondPublicKey: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
