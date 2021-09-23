"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accept_block_handler_1 = require("./accept-block-handler");
const block_handler_1 = require("./block-handler");
class ExceptionHandler extends block_handler_1.BlockHandler {
    async execute() {
        // Ensure the block has not been forged yet, as an exceptional
        // block bypasses all other checks.
        const forgedBlock = await this.blockchain.database.getBlock(this.block.data.id);
        if (forgedBlock) {
            return super.execute();
        }
        this.logger.warn(`Block ${this.block.data.height.toLocaleString()} (${this.block.data.id}) forcibly accepted.`);
        return new accept_block_handler_1.AcceptBlockHandler(this.blockchain, this.block).execute();
    }
}
exports.ExceptionHandler = ExceptionHandler;
//# sourceMappingURL=exception-handler.js.map