import { Bignum, configManager } from "@arkecosystem/crypto";
import { client } from "@arkecosystem/crypto";
import Command, { flags } from "@oclif/command";
import { satoshiFlag } from "../flags";
import { http } from "../http-client";
import { logger } from "../logger";

export abstract class BaseCommand extends Command {
    public static flags = {
        network: flags.string({
            description: "crypto network",
            default: "testnet",
        }),
        host: flags.string({
            description: "API host",
            default: "http://localhost",
        }),
        port: flags.integer({
            description: "API port",
            default: 4003,
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

    protected async sendTransaction(transactions: any[]): Promise<Record<string, any>> {
        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }

        for (const transaction of transactions) {
            logger.info(`Posting Transaction: ${transaction.id}`);
        }

        return http.post("transactions", { transactions });
    }

    protected async knockTransaction(id: string): Promise<void> {
        try {
            const { data } = await http.get(`transactions/${id}`);

            logger.info(`${id} was included in block ${data.blockId}`);
        } catch (error) {
            logger.error(error.message);

            logger.info(`${id} was not included in any blocks`);
        }
    }

    protected async make(command): Promise<any> {
        const { args, flags } = this.parse(command);

        http.setup(flags.host, flags.port);

        configManager.setFromPreset(flags.network);

        return { args, flags };
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

    private toSatoshi(value: number): number {
        return +new Bignum(value).times(1e8).toFixed();
    }
}
