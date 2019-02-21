import { client } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import sample from "lodash/sample";
import pluralize from "pluralize";
import { customFlags } from "../flags";
import { logger, parseFee, satoshiToArk } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class VoteCommand extends BaseCommand {
    public static description: string = "create multiple votes for a delegate";

    public static flags = {
        ...BaseCommand.flags,
        delegate: flags.string({
            description: "delegate public key",
        }),
        voteFee: customFlags.number({
            description: "vote fee",
            default: 1,
        }),
    };

    /**
     * Run vote command.
     * @return {void}
     */
    public async run(): Promise<void> {
        // tslint:disable-next-line: no-shadowed-variable
        const { flags } = await this.initialize(VoteCommand);

        const wallets = this.generateWallets();

        for (const wallet of wallets) {
            await TransferCommand.run(
                ["--recipient", wallet.address, "--amount", String(2), "--skipTesting"].concat(this.castFlags(flags)),
            );
        }

        let delegate = this.options.delegate;
        if (!delegate) {
            try {
                delegate = sample(await this.getDelegates()).publicKey;
            } catch (error) {
                logger.error(error);
                return;
            }
        }

        const voters = await this.getVoters(delegate);
        logger.info(`Sending ${this.options.number} vote ${pluralize("transaction", this.options.number)}`);

        const transactions = [];
        wallets.forEach((wallet, i) => {
            const transaction = client
                .getBuilder()
                .vote()
                .fee(parseFee(this.options.voteFee))
                .votesAsset([`+${delegate}`])
                .network(this.config.network.version)
                .sign(wallet.passphrase)
                .secondSign(this.config.secondPassphrase)
                .build();

            transactions.push(transaction);

            logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${satoshiToArk(transaction.data.fee)})`);
        });

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        const expectedVoterCount = voters.length + wallets.length;
        if (!this.options.skipValidation) {
            logger.info(`Expected end voters: ${expectedVoterCount}`);
        }

        try {
            await this.sendTransactions(transactions, "vote", !this.options.skipValidation);

            if (this.options.skipValidation) {
                return;
            }

            const voterCount = (await this.getVoters(delegate)).length;

            logger.info(`All transactions have been sent! Total voters: ${voterCount}`);

            if (voterCount !== expectedVoterCount) {
                logger.error(`Delegate voter count incorrect. '${voterCount}' but should be '${expectedVoterCount}'`);
            }
        } catch (error) {
            logger.error(
                `There was a problem sending transactions: ${error.response ? error.response.data.message : error}`,
            );
        }
    }
}
