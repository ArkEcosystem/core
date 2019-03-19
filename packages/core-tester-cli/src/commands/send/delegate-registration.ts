import { Address } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class DelegateRegistrationCommand extends SendCommand {
    public static description: string = "create multiple delegates";

    public static flags = {
        ...SendCommand.flagsSend,
        delegateFee: satoshiFlag({
            description: "delegate registration fee",
            default: 25,
        }),
    };

    protected getCommand(): any {
        return DelegateRegistrationCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.delegateFee}`, `--number=${flags.number}`, "--skipProbing"].concat(
                this.castFlags(flags),
            ),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const [address, wallet] of Object.entries(wallets)) {
            wallets[address].username = pokemon
                .random()
                .toLowerCase()
                .replace(/ /g, "_");

            transactions.push(
                this.signer.makeDelegate({
                    ...flags,
                    ...{
                        username: wallets[address].username,
                        // @ts-ignore
                        passphrase: wallet.passphrase,
                    },
                }),
            );
        }

        return transactions;
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
                await this.knockUsername(recipientId, wallets[recipientId].username);
            }
        }
    }

    private async knockUsername(address: string, expected: string): Promise<void> {
        const { username: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }
}
