import { TransactionType, TransactionTypeGroup } from "../enums";
import { IBlock, IBlockHeader, IState } from "../interfaces";
import { configManager } from "../managers";
import { Utils } from ".";
import { State } from "./state";

export class StateFactory {
    public static createGenesisState<B extends IBlockHeader>(genesisBlock: B & IBlock): IState<B> {
        if (genesisBlock.height !== 1) {
            throw new Error("Not a genesis block.");
        }

        const genesisMilestone = configManager.getMilestone(1);
        const genesisDelegates = genesisBlock.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => t.data.senderPublicKey!)
            .sort();

        if (genesisDelegates.length !== genesisMilestone.activeDelegates) {
            throw new Error("Invalid genesis block.");
        }

        const genesisRound = { no: 1, height: 1, delegates: genesisDelegates };
        const genesisSlot = { no: 0, timestamp: 0, height: 1 };

        const nextRound = genesisRound;
        const nextForgers = Utils.getRoundForgers(nextRound);
        const nextValidators = Utils.getValidators(genesisRound, nextRound);

        const data = {
            finalizedTransactionCount: genesisBlock.numberOfTransactions,
            forgedTransactionCount: genesisBlock.numberOfTransactions,
            lastRound: genesisRound,
            lastSlot: genesisSlot,
            lastBlock: genesisBlock,
            justifiedBlock: genesisBlock,
            finalizedBlock: genesisBlock,
            finalizedRound: genesisRound,
            next: {
                round: nextRound,
                forgers: nextForgers,
                validators: nextValidators,
            },
        };

        return new State<B>(data);
    }
}
