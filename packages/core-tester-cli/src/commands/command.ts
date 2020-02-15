import { Identities, Managers, Types, Utils } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import delay from "delay";
import chunk from "lodash.chunk";
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
        nonce: flags.integer({
            description: "starting nonce",
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
    protected signer: Signer;
    protected constants: Record<string, any>;

    protected get network(): number {
        return this.constants.pubKeyHash;
    }

    protected async make(command): Promise<any> {
        const { args, flags } = this.parse(command);

        const host = flags.host.startsWith("http") ? flags.host : `http://${flags.host}`;
        this.api = new HttpClient(`${host}:${flags.portAPI}/api/`);

        await this.setupConfiguration();
        await this.setupConfigurationForCrypto();

        if (flags.passphrase) {
            const nonce = flags.nonce || (await this.getNonce(flags.passphrase));
            this.signer = new Signer(this.network, nonce);
        }

        return { args, flags };
    }

    protected makeOffline(command): any {
        const { args, flags } = this.parse(command);

        Managers.configManager.setFromPreset(flags.network as Types.NetworkName);

        this.signer = new Signer(Managers.configManager.all().network.pubKeyHash, flags.nonce);

        return { args, flags };
    }

    protected async sendTransaction(transactions: any[]): Promise<Record<string, any>> {
        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }

        for (const transaction of transactions) {
            let recipientId = transaction.recipientId;

            if (!recipientId) {
                recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
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

    protected async knockBalance(address: string, expected: Utils.BigNumber): Promise<void> {
        const actual = await this.getWalletBalance(address);

        if (expected.isEqualTo(actual)) {
            logger.info(`[W] ${address} (${this.fromSatoshi(actual)})`);
        } else {
            logger.error(`[W] ${address} (${this.fromSatoshi(expected)} / ${this.fromSatoshi(actual)})`);
        }
    }

    protected async getWalletBalance(address: string): Promise<Utils.BigNumber> {
        try {
            const { data } = await this.api.get(`wallets/${address}`);

            return Utils.BigNumber.make(data.balance);
        } catch (error) {
            return Utils.BigNumber.ZERO;
        }
    }

    protected async broadcastTransactions(transactions) {
        for (const batch of chunk(transactions, 40)) {
            await this.sendTransaction(batch);
        }

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
        return Utils.BigNumber.make(value)
            .times(1e8)
            .toFixed();
    }

    protected fromSatoshi(satoshi) {
        return Utils.formatSatoshi(satoshi);
    }

    private async setupConfiguration() {
        try {
            const { data } = await this.api.get("node/configuration");

            this.constants = data.constants;
        } catch (error) {
            this.error(error.message);
        }
    }

    private async setupConfigurationForCrypto() {
        try {
            const { data: dataCrypto } = await this.api.get("node/configuration/crypto");
            const { data: dataStatus } = await this.api.get("node/status");

            Managers.configManager.setConfig(dataCrypto);
            Managers.configManager.setHeight(dataStatus.now);
        } catch (error) {
            this.error(error.message);
        }
    }

    private async awaitConfirmations(transactions): Promise<void> {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        const waitPerBlock =
            this.constants.blocktime * Math.ceil(transactions.length / this.constants.block.maxTransactions);

        await delay(waitPerBlock * 1200);
    }

    private async getNonce(passphrase: string): Promise<string> {
        const address: string = Identities.Address.fromPassphrase(passphrase);

        try {
            const { data } = await this.api.get(`wallets/${address}`);
            return data.nonce
                ? Utils.BigNumber.make(data.nonce)
                      .plus(1)
                      .toString()
                : "1";
        } catch (ex) {
            return "1";
        }
    }
}
