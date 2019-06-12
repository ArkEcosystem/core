import { Identities } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class VoteCommand extends SendCommand {
    public static description: string = "create multiple votes for a delegate";

    public static flags = {
        ...SendCommand.flagsSend,
        delegate: flags.string({
            description: "delegate public key",
        }),
        voteFee: satoshiFlag({
            description: "vote fee",
            default: 1,
        }),
    };

    protected getCommand(): any {
        return VoteCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.voteFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const [address, wallet] of Object.entries(wallets)) {
            const delegate = flags.delegate || (await this.getRandomDelegate());

            const transaction = this.signer.makeVote({
                ...flags,
                ...{
                    delegate,
                    passphrase: wallet.passphrase,
                },
            });

            wallets[address].vote = delegate;

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
                await this.knockVote(recipientId, wallets[recipientId].vote);
            }
        }
    }

    private async knockVote(address: string, expected: string): Promise<void> {
        const { vote: actual } = (await this.api.get(`wallets/${address}`)).data;

        if (actual === expected) {
            logger.info(`[W] ${address} (${actual})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${actual})`);
        }
    }

    private async getRandomDelegate() {
        const { data } = await this.api.get("delegates");

        return data[0].publicKey;
    }
}
