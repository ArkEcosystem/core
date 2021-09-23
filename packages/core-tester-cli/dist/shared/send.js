"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../commands/command");
class SendCommand extends command_1.BaseCommand {
    async run() {
        // Parse...
        const { flags } = await this.make(this.getCommand());
        // Waves...
        let wallets = {};
        for (let i = 0; i < flags.waves; i++) {
            // Prepare...
            const newWallets = await this.createWalletsWithBalance(flags);
            wallets = { ...wallets, ...newWallets };
            // Sign...
            const transactions = await this.signTransactions(flags, newWallets);
            // Expect...
            if (!flags.skipProbing) {
                await this.expectBalances(transactions, newWallets);
            }
            // Send...
            await this.broadcastTransactions(transactions);
            // Verify...
            if (!flags.skipProbing) {
                await this.verifyTransactions(transactions, newWallets);
            }
        }
        // Return...
        return wallets;
    }
}
exports.SendCommand = SendCommand;
//# sourceMappingURL=send.js.map