import { Contracts } from "@arkecosystem/core-kernel";
import { BlocksRoute } from "../routes/blocks";
import { InternalRoute } from "../routes/internal";
import { PeerRoute } from "../routes/peer";
import { Codec } from "../routes/route";
import { TransactionsRoute } from "../routes/transactions";

export const getCodec = (app: Contracts.Kernel.Application, event: string): Codec => {
    const allRoutesConfigByPath = {
        ...app.resolve(InternalRoute).getRoutesConfigByPath(),
        ...app.resolve(PeerRoute).getRoutesConfigByPath(),
        ...app.resolve(BlocksRoute).getRoutesConfigByPath(),
        ...app.resolve(TransactionsRoute).getRoutesConfigByPath(),
    };

    const codecByEvent = {};
    for (const routeConfig of Object.values(allRoutesConfigByPath)) {
        codecByEvent[routeConfig.id] = routeConfig.codec;
    }

    return codecByEvent[event];
}