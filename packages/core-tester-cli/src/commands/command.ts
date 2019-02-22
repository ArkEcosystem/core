import { bignumify } from "@arkecosystem/core-utils";
import { Bignum, formatSatoshi } from "@arkecosystem/crypto";
import { client } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import delay from "delay";
import { satoshiFlag } from "../flags";
import { HttpClient } from "../http-client";
import { logger } from "../logger";

export abstract class BaseCommand extends Command {
    public static flagsConfig = {
        host: flags.string({
            description: "API host",
            default: "http://localhost",
        }),
        portAPI: flags.integer({
            description: "API port",
            default: 4003,
        }),
        portP2P: flags.integer({
            description: "P2P port",
            default: 4000,
        }),
    };

    public static flagsSent = {
        ...BaseCommand.flagsConfig,
        passphrase: flags.string({
            description: "passphrase of initial wallet",
            default: "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire",
        }),
        secondPassphrase: flags.string({
            description: "second passphrase of initial wallet",
        }),
        number: flags.integer({
            description: "number of wallets",
            default: 10,
        }),
        amount: satoshiFlag({
            description: "initial wallet token amount",
            default: 2,
        }),
        transferFee: satoshiFlag({
            description: "transfer fee",
            default: 0.1,
        }),
    };

    public static flagsDebug = {
        log: flags.string({
            description: "log the data to the console",
        }),
        copy: flags.string({
            description: "copy the data to the clipboard",
        }),
    };

    protected api: HttpClient;
    protected p2p: HttpClient;
    protected network: Record<string, any>;
    protected constants: Record<string, any>;

    protected async make(command): Promise<any> {
        const { args, flags } = this.parse(command);

        this.api = new HttpClient(`${flags.host}:${flags.portAPI}/api/v2/`);
        this.p2p = new HttpClient(`${flags.host}:${flags.portP2P}/`);

        await this.setupConstants();
        await this.setupNetwork();

        return { args, flags };
    }

    protected async sendTransaction(transactions: any[]): Promise<Record<string, any>> {
        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }

        for (const transaction of transactions) {
            logger.info(
                `[T] ${transaction.id} (${transaction.recipientId} / ${this.fromSatoshi(
                    transaction.amount,
                )} / ${this.fromSatoshi(transaction.fee)})`,
            );
        }

        return this.api.post("transactions", { transactions });
    }

    protected async knockTransaction(id: string): Promise<boolean> {
        try {
            const { data } = await this.api.get(`transactions/${id}`);

            logger.info(`[T] ${id} (${data.blockId})`);

            return true;
        } catch (error) {
            logger.error(error.message);

            logger.error(`[T] ${id} (not forged)`);

            return false;
        }
    }

    protected async knockBalance(address: string, expected: Bignum): Promise<void> {
        const actual = await this.getWalletBalance(address);

        if (bignumify(expected).isEqualTo(actual)) {
            logger.info(`[W] ${address} (${this.fromSatoshi(actual)})`);
        } else {
            logger.error(`[W] ${address} (${this.fromSatoshi(expected)} / ${this.fromSatoshi(actual)})`);
        }
    }

    protected async getWalletBalance(address: string): Promise<Bignum> {
        try {
            const { data } = await this.api.get(`wallets/${address}`);

            return bignumify(data.balance);
        } catch (error) {
            return Bignum.ZERO;
        }
    }

    protected signTransfer(opts: Record<string, any>): any {
        const transfer = client
            .getBuilder()
            .transfer()
            .fee(this.toSatoshi(opts.transferFee))
            .network(this.network.version)
            .recipientId(opts.recipient)
            .amount(this.toSatoshi(opts.amount));

        if (opts.vendorField) {
            transfer.vendorField(opts.vendorField);
        }

        transfer.sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transfer.secondSign(opts.secondPassphrase);
        }

        return transfer.getStruct();
    }

    protected signTransfers(flags: Record<string, any>, wallets: Record<string, any>) {
        const transactions = [];

        for (const wallet of Object.keys(wallets)) {
            transactions.push(this.signTransfer({ ...flags, ...{ recipient: wallet } }));
        }

        return transactions;
    }

    protected async verifyTransfers(transactions, wallets) {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                await this.knockBalance(transaction.recipientId, wallets[transaction.recipientId].expectedBalance);
            }
        }
    }

    protected async expectBalances(transactions, wallets) {
        for (const transaction of transactions) {
            const currentBalance = await this.getWalletBalance(transaction.recipientId);
            wallets[transaction.recipientId].expectedBalance = currentBalance.plus(transaction.amount);
        }
    }

    protected async broadcastTransfers(transactions) {
        const sendTransactions = [];
        for (const transaction of transactions) {
            sendTransactions.push(this.sendTransaction(transaction));
        }

        await Promise.all(sendTransactions);

        return this.awaitConfirmations(transactions);
    }

    protected castFlags(values: Record<string, any>): string[] {
        return Object.keys(BaseCommand.flagsConfig)
            .map((key: string) => {
                const value = values[key];

                if (value === undefined) {
                    return undefined;
                }

                if (value === true) {
                    return `--${key}`;
                }

                return `--${key}=${value}`;
            })
            .filter(value => value !== undefined);
    }

    protected toSatoshi(value) {
        return bignumify(value)
            .times(1e8)
            .toFixed();
    }

    protected fromSatoshi(satoshi) {
        return formatSatoshi(satoshi);
    }

    private async setupConstants() {
        try {
            const { data } = await this.api.get("node/configuration");

            this.constants = data.constants;
        } catch (error) {
            logger.error(error.message);
            process.exit(1);
        }
    }

    private async setupNetwork() {
        try {
            const { data } = await this.p2p.get("config");

            this.network = data.network;
        } catch (error) {
            logger.error(error.message);
            process.exit(1);
        }
    }

    private async awaitConfirmations(transactions): Promise<void> {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const waitPerBlock =
            this.constants.blocktime * Math.ceil(transactions.length / this.constants.block.maxTransactions);

        await delay(waitPerBlock * 1000);
    }
}
