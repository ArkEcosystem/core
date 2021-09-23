import { BaseCommand } from "../commands/command";
export declare abstract class SendCommand extends BaseCommand {
    run(): Promise<any>;
    protected abstract getCommand(): Promise<any>;
    protected abstract createWalletsWithBalance(flags: Record<string, any>): Promise<any[]>;
    protected abstract signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]>;
    protected abstract expectBalances(transactions: any, wallets: any): Promise<void>;
    protected abstract verifyTransactions(transactions: any, wallets: any): Promise<void>;
}
