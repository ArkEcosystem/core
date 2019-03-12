import { bignumify } from "@arkecosystem/core-utils";
import { Address, Bignum, formatSatoshi } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import delay from "delay";
import { satoshiFlag } from "../flags";
import { HttpClient } from "../http-client";
import { logger } from "../logger";
import { Signer } from "../signer";

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

    public static flagsSend = {
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
            default: 1,
        }),
        amount: satoshiFlag({
            description: "initial wallet token amount",
            default: 2,
        }),
        transferFee: satoshiFlag({
            description: "transfer fee",
            default: 0.1,
        }),
        skipProbing: flags.boolean({
            description: "skip transaction probing",
        }),
        waves: flags.integer({
            description: "number of waves to send",
            default: 1,
        }),
    };

    public static flagsDebug = {
        network: flags.string({
            description: "network used for crypto",
            default: "testnet",
        }),
        log: flags.boolean({
            description: "log the data to the console",
        }),
        copy: flags.boolean({
            description: "copy the data to the clipboard",
        }),
    };

    protected api: HttpClient;
    protected p2p: HttpClient;
    protected signer: Signer;
    protected network: Record<string, any>;
    protected constants: Record<string, any>;

    protected async make(command): Promise<any> {
        const { args, flags } = this.parse(command);

        this.api = new HttpClient(`${flags.host}:${flags.portAPI}/api/v2/`);
        this.p2p = new HttpClient(`${flags.host}:${flags.portP2P}/`);

        await this.setupConstants();
        await this.setupNetwork();

        this.signer = new Signer(this.network);

        return { args, flags };
    }

    protected async sendTransaction(transactions: any[]): Promise<Record<string, any>> {
        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }

        for (const transaction of transactions) {
            let recipientId = transaction.recipientId;

            if (!recipientId) {
                recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);
            }

            logger.info(
                `[T] ${transaction.id} (${recipientId} / ${this.fromSatoshi(transaction.amount)} / ${this.fromSatoshi(
                    transaction.fee,
                )})`,
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

    protected async broadcastTransactions(transactions) {
        await this.sendTransaction(transactions);

        return this.awaitConfirmations(transactions);
    }

    protected async getTransaction(id: string): Promise<any> {
        try {
            const { data } = await this.api.get(`transactions/${id}`);

            return data;
        } catch (error) {
            logger.error(error.message);

            return false;
        }
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
