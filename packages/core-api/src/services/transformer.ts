import { transformAccountLegacy } from "../versions/1/accounts/transformer";
import { transformBlockLegacy } from "../versions/1/blocks/transformer";
import { transformDelegateLegacy } from "../versions/1/delegates/transformer";
import { transformPeerLegacy } from "../versions/1/peers/transformer";
import { transformFeeStatisticsLegacy } from "../versions/1/shared/transformers/fee-statistics";
import { transformPortsLegacy } from "../versions/1/shared/transformers/ports";
import { transformVoterLegacy } from "../versions/1/shared/transformers/voter";
import { transformTransactionLegacy } from "../versions/1/transactions/transformer";

import { transformBlock } from "../versions/2/blocks/transformer";
import { transformDelegate } from "../versions/2/delegates/transformer";
import { transformPeer } from "../versions/2/peers/transformer";
import { transformRoundDelegate } from "../versions/2/rounds/transformer";
import { transformFeeStatistics } from "../versions/2/shared/transformers/fee-statistics";
import { transformPorts } from "../versions/2/shared/transformers/ports";
import { transformTransaction } from "../versions/2/transactions/transformer";
import { transformWallet } from "../versions/2/wallets/transformer";

class Transformer {
    private transformers: Map<number, any> = new Map();

    public constructor() {
        this.transformers.set(1, {
            account: transformAccountLegacy,
            block: transformBlockLegacy,
            delegate: transformDelegateLegacy,
            "fee-statistics": transformFeeStatisticsLegacy,
            peer: transformPeerLegacy,
            ports: transformPortsLegacy,
            transaction: transformTransactionLegacy,
            voter: transformVoterLegacy,
        });

        this.transformers.set(2, {
            block: transformBlock,
            delegate: transformDelegate,
            "fee-statistics": transformFeeStatistics,
            peer: transformPeer,
            ports: transformPorts,
            "round-delegate": transformRoundDelegate,
            transaction: transformTransaction,
            wallet: transformWallet,
        });
    }

    public toResource(request, data, transformer): object {
        return this.transformers.get(request.pre.apiVersion)[transformer](data);
    }

    public toCollection(request, data, transformer): object[] {
        return data.map(d => this.toResource(request, d, transformer));
    }
}

export const transformerService = new Transformer();
