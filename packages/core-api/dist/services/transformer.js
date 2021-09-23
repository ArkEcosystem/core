"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transformer_1 = require("../handlers/blocks/transformer");
const transformer_2 = require("../handlers/bridgechains/transformer");
const transformer_3 = require("../handlers/businesses/transformer");
const transformer_4 = require("../handlers/delegates/transformer");
const transformer_5 = require("../handlers/locks/transformer");
const transformer_6 = require("../handlers/peers/transformer");
const transformer_7 = require("../handlers/rounds/transformer");
const fee_statistics_1 = require("../handlers/shared/transformers/fee-statistics");
const ports_1 = require("../handlers/shared/transformers/ports");
const transformer_8 = require("../handlers/transactions/transformer");
const transformer_9 = require("../handlers/wallets/transformer");
class Transformer {
    constructor() {
        this.transformers = {
            block: transformer_1.transformBlock,
            bridgechain: transformer_2.transformBridgechain,
            business: transformer_3.transformBusiness,
            delegate: transformer_4.transformDelegate,
            "fee-statistics": fee_statistics_1.transformFeeStatistics,
            peer: transformer_6.transformPeer,
            ports: ports_1.transformPorts,
            "round-delegate": transformer_7.transformRoundDelegate,
            transaction: transformer_8.transformTransaction,
            wallet: transformer_9.transformWallet,
            lock: transformer_5.transformLock,
        };
    }
    toResource(data, transformer, transform = true) {
        return this.transformers[transformer](data, transform);
    }
    toCollection(data, transformer, transform = true) {
        return data.map(d => this.toResource(d, transformer, transform));
    }
}
exports.transformerService = new Transformer();
//# sourceMappingURL=transformer.js.map