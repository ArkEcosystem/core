"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_processor_1 = require("../block-processor");
const block_handler_1 = require("./block-handler");
class NonceOutOfOrderHandler extends block_handler_1.BlockHandler {
    async execute() {
        await super.execute();
        return block_processor_1.BlockProcessorResult.Rejected;
    }
}
exports.NonceOutOfOrderHandler = NonceOutOfOrderHandler;
//# sourceMappingURL=nonce-out-of-order-handler.js.map