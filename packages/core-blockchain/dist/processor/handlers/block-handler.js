"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const block_processor_1 = require("../block-processor");
class BlockHandler {
    constructor(blockchain, block) {
        this.blockchain = blockchain;
        this.block = block;
        this.logger = core_container_1.app.resolvePlugin("logger");
    }
    async execute() {
        this.blockchain.resetLastDownloadedBlock();
        return block_processor_1.BlockProcessorResult.Rejected;
    }
}
exports.BlockHandler = BlockHandler;
//# sourceMappingURL=block-handler.js.map