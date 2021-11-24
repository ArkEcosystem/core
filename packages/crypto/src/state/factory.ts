import { TransactionType, TransactionTypeGroup } from "../enums";
import { IBlock, IBlockHeader, IState } from "../interfaces";
import { configManager } from "../managers";
import { Rounds } from "./rounds";
import { Slots } from "./slots";
import { State } from "./state";

export class StateFactory {
    public static createGenesisState(genesisBlock: IBlock): IState<IBlock> {
        if (genesisBlock.height !== 1) {
            throw new Error("Not a genesis block.");
        }

        const genesisRound = Rounds.getRound(genesisBlock.height);
        const genesisSlot = Slots.getGenesisSlot();
        const genesisMilestone = configManager.getMilestone(genesisBlock.height);
        const genesisDelegates = genesisBlock.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => t.data.senderPublicKey!)
            .sort();

        if (genesisDelegates.length !== genesisMilestone.activeDelegates) {
            throw new Error("Invalid genesis block.");
        }

        const shuffledGenesisDelegates = Rounds.getRoundForgers(genesisRound, genesisDelegates);
        const stateData = {
            finalizedTransactionCount: genesisBlock.numberOfTransactions,
            forgedTransactionCount: genesisBlock.numberOfTransactions,
            finalizedBlock: genesisBlock,
            justifiedBlock: genesisBlock,
            lastBlock: genesisBlock,
            lastSlot: genesisSlot,
            finalizedDelegates: shuffledGenesisDelegates,
            lastDelegates: shuffledGenesisDelegates,
        };

        if (Rounds.getRound(genesisBlock.height) === Rounds.getRound(genesisBlock.height + 1)) {
            return new State(stateData, shuffledGenesisDelegates);
        }

        return new State(stateData);
    }
}
