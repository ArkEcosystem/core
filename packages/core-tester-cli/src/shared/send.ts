import { BaseCommand } from "../commands/command";

export abstract class SendCommand extends BaseCommand {
    public async run(): Promise<any> {
        // Parse...
        const { flags } = await this.make(this.getCommand());

        // Waves...
        for (let i = 0; i < flags.waves; i++) {
            // Prepare...
            const wallets = await this.createWalletsWithBalance(flags);

            // Sign...
            const transactions = await this.signTransactions(flags, wallets);

            // Expect...
            if (!flags.skipProbing) {
                await this.expectBalances(transactions, wallets);
            }

            // Send...
            await this.broadcastTransactions(transactions);

            // Verify...
            if (!flags.skipProbing) {
                await this.verifyTransactions(transactions, wallets);
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
