import { Bignum } from "@arkecosystem/crypto";
import { client } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import { satoshiFlag } from "../flags";
import { HttpClient } from "../http-client";
import { logger } from "../logger";

export abstract class BaseCommand extends Command {
    public static flagsSent = {
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
            logger.info(`Posting Transaction: ${transaction.id}`);
        }

        return this.api.post("transactions", { transactions });
    }

    protected async knockTransaction(id: string): Promise<void> {
        try {
            const { data } = await this.api.get(`transactions/${id}`);

            logger.info(`${id} was included in block ${data.blockId}`);
        } catch (error) {
            logger.error(error.message);

            logger.info(`${id} was not included in any blocks`);
        }
    }

    protected signTransaction(opts: Record<string, any>): any {
        const transfer = client
            .getBuilder()
            .transfer()
            .fee(this.toSatoshi(opts.transferFee))
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

    private async setupConstants() {
        const { data } = await this.api.get("node/configuration");

        this.constants = data.constants;
    }

    private async setupNetwork() {
        const { data } = await this.p2p.get("config");

        this.network = data.network;
    }

    private toSatoshi(value: number): number {
        return +new Bignum(value).times(1e8).toFixed();
    }
}
