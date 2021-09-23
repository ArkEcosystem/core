import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";
export declare class GenerateCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: CommandFlags;
    run(): Promise<void>;
    private generateNetwork;
    private generateCryptoNetwork;
    private generateCryptoMilestones;
    private generateCryptoGenesisBlock;
    private generateCoreDelegates;
    private createWallet;
    private buildDelegateTransactions;
    private createTransferTransaction;
    private formatGenesisTransaction;
    private createGenesisBlock;
    private getBlockId;
    private signBlock;
    private getHash;
    private getBytes;
}
