import { transformBlock } from "../handlers/blocks/transformer";
import { transformDelegate } from "../handlers/delegates/transformer";
import { transformPeer } from "../handlers/peers/transformer";
import { transformRoundDelegate } from "../handlers/rounds/transformer";
import { transformFeeStatistics } from "../handlers/shared/transformers/fee-statistics";
import { transformPorts } from "../handlers/shared/transformers/ports";
import { transformTransaction } from "../handlers/transactions/transformer";
import { transformWallet } from "../handlers/wallets/transformer";

class Transformer {
    private readonly transformers: Record<string, any> = {
        block: transformBlock,
        delegate: transformDelegate,
        "fee-statistics": transformFeeStatistics,
        peer: transformPeer,
        ports: transformPorts,
        "round-delegate": transformRoundDelegate,
        transaction: transformTransaction,
        wallet: transformWallet,
    };

    public toResource(data, transformer): object {
        return this.transformers[transformer](data);
    }

    public toCollection(data, transformer): object[] {
        return data.map(d => this.toResource(d, transformer));
    }
}

export const transformerService = new Transformer();
