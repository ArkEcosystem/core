import { client } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import pluralize from "pluralize";
import superheroes from "superheroes";
import { customFlags } from "../flags";
import { logger, parseFee, satoshiToArk } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class DelegateRegistrationCommand extends BaseCommand {
    public static description: string = "create multiple delegates";

    public static flags = {
        ...BaseCommand.flags,
        delegateFee: customFlags.number({
            description: "delegate registration fee",
            default: 25,
        }),
    };

    /**
     * Run delegate-registration command.
     * @return {void}
     */
    public async run(): Promise<void> {
        // tslint:disable-next-line: no-shadowed-variable
        const { flags } = await this.initialize(DelegateRegistrationCommand);

        const wallets = this.generateWallets();

        for (const wallet of wallets) {
            await TransferCommand.run(
                ["--amount", String(this.options.amount || 25), "--recipient", wallet.address, "--skipTesting"].concat(
                    this.castFlags(flags),
                ),
            );
        }

        const delegates = await this.getDelegates();

        logger.error(
            `Sending ${this.options.number} delegate registration ${pluralize("transaction", this.options.number)}`,
        );

        if (!this.options.skipValidation) {
            logger.error(`Starting delegate count: ${delegates.length}`);
        }

        const transactions = [];
        const usedDelegateNames = delegates.map(delegate => delegate.username);

        wallets.forEach((wallet, i) => {
            while (!wallet.username || usedDelegateNames.includes(wallet.username)) {
                wallet.username = superheroes.random();
            }

            wallet.username = wallet.username.toLowerCase().replace(/ /g, "_");
            usedDelegateNames.push(wallet.username);

            const transaction = client
                .getBuilder()
                .delegateRegistration()
                .fee(parseFee(this.options.delegateFee))
                .usernameAsset(wallet.username)
                .network(this.config.network.version)
                .sign(wallet.passphrase)
                .secondSign(this.config.secondPassphrase)
                .build();

            transactions.push(transaction);

            logger.info(
                `${i} ==> ${transaction.id}, ${wallet.address} (fee: ${satoshiToArk(transaction.data.fee)}, username: ${
                    wallet.username
                })`,
            );
        });

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        const expectedDelegates = delegates.length + wallets.length;
        if (!this.options.skipValidation) {
            logger.info(`Expected end delegate count: ${expectedDelegates}`);
        }

        try {
            await this.sendTransactions(transactions, "delegate", !this.options.skipValidation);

            if (this.options.skipValidation) {
                return;
            }

            const targetDelegates = await this.getDelegates();
            logger.info(`All transactions have been sent! Total delegates: ${targetDelegates.length}`);

            if (targetDelegates.length !== expectedDelegates) {
                logger.error(
                    `Delegate count incorrect. '${targetDelegates.length}' but should be '${expectedDelegates}'`,
                );
            }
        } catch (error) {
            logger.error(
                `There was a problem sending transactions: ${error.response ? error.response.data.message : error}`,
            );
        }
    }
}
