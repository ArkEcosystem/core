import { Enums } from "@arkecosystem/core-kernel";
import { Contracts } from "@arkecosystem/core-kernel";
import { Index } from "./base";

export class Wallets extends Index {
    public async index(): Promise<void> {
        const iterations: number = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
            const offset: number = this.chunkSize * i;

            const rows: Contracts.State.Wallet[] = this.database.walletManager
                .allByAddress()
                .slice(offset, offset + this.chunkSize);

            if (rows.length) {
                this.logger.info(`[ES] Indexing ${rows.length} wallets`);

                try {
                    for (const row of rows) {
                        // @ts-ignore
                        row.id = row.address;
                    }

                    await this.bulkUpsert(rows);
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen(): void {
        this.emitter.listen(Enums.Events.State.RoundApplied, () => this.index());
    }

    protected async countWithDatabase(): Promise<number> {
        return Object.keys(this.database.walletManager.allByAddress()).length;
    }
}
