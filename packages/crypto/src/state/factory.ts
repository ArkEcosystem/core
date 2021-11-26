import { TransactionType, TransactionTypeGroup } from "../enums";
import { CryptoError } from "../errors";
import { IBlock, IBlockHeader, IState } from "../interfaces";
import { configManager } from "../managers";
import { Consensus } from ".";
import { Forgers } from "./forgers";
import { Rounds } from "./rounds";
import { Slots } from "./slots";
import { State } from "./state";

export class StateFactory {
    public static createGenesisState(genesisBlock: IBlock): IState<IBlock> {
        if (genesisBlock.height !== 1) {
            throw new Error("Not a genesis block.");
        }

        const genesisSlot = Slots.getGenesisSlot();
        const genesisRound = Rounds.getGenesisRound();
        const genesisMillestone = configManager.getMilestone(genesisBlock.height);
        const genesisDelegates = genesisBlock.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => t.data.senderPublicKey!)
            .sort();

        if (genesisDelegates.length !== genesisMillestone.activeDelegates) {
            throw new Error("Invalid genesis block.");
        }

        const state = new State(
            genesisBlock.numberOfTransactions,
            genesisBlock.numberOfTransactions,
            genesisDelegates,
            genesisBlock,
            genesisBlock,
            genesisBlock,
            genesisSlot,
            genesisRound,
            genesisDelegates,
        );

        if (state.lastRound.no === state.nextBlockRound.no) {
            state.setNextBlockRoundDelegates(genesisDelegates);
        }

        return state;
    }

    public static createNextState<B extends IBlockHeader>(prevState: IState<B>, nextBlock: B): IState<B> {
        try {
            if (!prevState.nextBlockRoundDelegates) {
                throw new CryptoError("Round delegates aren't set.");
            }

            if (nextBlock.previousBlock !== prevState.lastBlock.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (nextBlock.height !== prevState.lastBlock.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const nextForgedTransactionCount = prevState.forgedTransactionCount + nextBlock.numberOfTransactions;
            const nextBlockSlot = Slots.getNextBlockSlot(prevState, nextBlock.timestamp);
            const nextBlockForger = Forgers.getNextBlockForger(prevState, nextBlockSlot);

            if (nextBlockSlot.no <= prevState.lastSlot.no) {
                throw new CryptoError("Invalid timestamp.");
            }

            if (nextBlock.generatorPublicKey !== nextBlockForger) {
                throw new CryptoError("Invalid generator public key.");
            }

            let nextJustifiedBlock = prevState.justifiedBlock;
            let nextFinalizedBlock = prevState.finalizedBlock;
            let nextFinalizedDelegates = prevState.finalizedDelegates;
            let nextFinalizedTransactionCount = prevState.finalizedTransactionCount;

            if (nextBlock.version === 1 && Consensus.hasSupermajorityVote(prevState, nextBlock.previousBlockVotes)) {
                nextJustifiedBlock = prevState.lastBlock;

                if (nextJustifiedBlock.height === prevState.justifiedBlock.height + 1) {
                    nextFinalizedBlock = prevState.justifiedBlock;
                    nextFinalizedDelegates = prevState.lastRoundDelegates;
                    nextFinalizedTransactionCount =
                        prevState.forgedTransactionCount - prevState.lastBlock.numberOfTransactions;
                }
            }

            const nextState = new State(
                nextForgedTransactionCount,
                nextFinalizedTransactionCount,
                nextFinalizedDelegates,
                nextFinalizedBlock,
                nextJustifiedBlock,
                nextBlock,
                nextBlockSlot,
                prevState.nextBlockRound,
                prevState.nextBlockRoundDelegates,
            );

            if (nextState.nextBlockRound.no === prevState.nextBlockRound.no) {
                nextState.nextBlockRoundDelegates = prevState.nextBlockRoundDelegates;
                nextState.nextBlockRoundForgers = prevState.nextBlockRoundForgers;
            }

            return nextState;
        } catch (cause) {
            const msg = `Cannot chain new block (height=${nextBlock.height}, id=${nextBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }
}
