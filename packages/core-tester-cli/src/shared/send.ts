import { BaseCommand } from "../commands/command";

export abstract class SendCommand extends BaseCommand {
    public async run(): Promise<any> {
        // Parse...
        const { flags } = await this.make(this.getCommand());

        // Waves...
        let wallets = [];
        for (let i = 0; i < flags.waves; i++) {
            // Prepare...
            const newWallets = await this.createWalletsWithBalance(flags);
            wallets = wallets.concat(newWallets);

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

    protected abstract getCommand(): Promise<any>;

    protected abstract async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]>;

    protected abstract async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]>;

    protected abstract async expectBalances(transactions, wallets): Promise<void>;

    protected abstract async verifyTransactions(transactions, wallets): Promise<void>;
}
