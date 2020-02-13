import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { DynamicFeeMatcher } from "./dynamic-fee-matcher";
import { LowFeeError } from "./errors";

@Container.injectable()
export class Processor implements Contracts.TransactionPool.Processor {
    public accept: string[] = [];
    public broadcast: string[] = [];
    public excess: string[] = [];
    public invalid: string[] = [];
    public errors: string[] | undefined = undefined;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly pool!: Contracts.TransactionPool.Service;

    @Container.inject(DynamicFeeMatcher)
    private readonly dynamicFeeMatcher!: DynamicFeeMatcher;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    public async process(transactions: Interfaces.ITransaction[]): Promise<void> {
        const broadcastable: Interfaces.ITransaction[] = [];

        for (const transaction of transactions) {
            AppUtils.assert.defined<string>(transaction.id);

            try {
                const dynamicFee = await this.dynamicFeeMatcher.match(transaction);
                if (!dynamicFee.enterPool) {
                    throw new LowFeeError(transaction);
                }
                await this.pool.add(transaction);
                this.accept.push(transaction.id);
                if (dynamicFee.broadcast) {
                    broadcastable.push(transaction);
                    this.broadcast.push(transaction.id);
                }
            } catch (error) {
                if (!this.errors) {
                    this.errors = [];
                }
                this.errors.push(error.message);

                if (error.type === "ERR_EXCEEDS_MAX_COUNT") {
                    this.excess.push(transaction.id);
                } else {
                    this.invalid.push(transaction.id);
                }
            }
        }

        await this.networkMonitor.broadcastTransactions(broadcastable);
    }
}
