import { Rounds, Slots } from "../crypto";
import { TransactionType, TransactionTypeGroup } from "../enums";
import { IBlock, IState } from "../interfaces";
import { configManager } from "../managers";
import { State } from "./state";

export class StateFactory {
    public static createGenesisState(block: IBlock): IState<IBlock> {
        if (block.height !== 1) {
            throw new Error("Not a genesis block.");
        }

        const slot = Slots.getGenesisSlot();
        const round = Rounds.getRound(block.height);
        const millestone = configManager.getMilestone(block.height);
        const delegatePublicKeys = block.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => t.data.senderPublicKey!)
            .sort();

        if (delegatePublicKeys.length !== millestone.activeDelegates) {
            throw new Error("Invalid genesis block.");
        }

        const shuffledDelegates = Rounds.getShuffledDelegates(round, delegatePublicKeys);
        const stateData = {
            finalizedTransactionCount: block.numberOfTransactions,
            forgedTransactionCount: block.numberOfTransactions,
            finalizedBlock: block,
            justifiedBlock: block,
            lastBlock: block,
            lastSlot: slot,
            finalizedDelegates: shuffledDelegates,
            lastDelegates: shuffledDelegates,
        };

        if (Rounds.getRound(block.height) === Rounds.getRound(block.height + 1)) {
            return new State(stateData, shuffledDelegates);
        }

        return new State(stateData);
    }
}
