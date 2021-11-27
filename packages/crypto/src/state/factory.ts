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
    public static createGenesisState(genesisBlock: IBlock): IState {
        if (genesisBlock.height !== 1) {
            throw new Error("Not a genesis block.");
        }

        const genesisSlot = Slots.getGenesisSlot();
        const genesisRound = Rounds.getGenesisRound();
        const genesisMilestone = configManager.getMilestone(genesisBlock.height);
        const genesisDelegates = genesisBlock.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => t.data.senderPublicKey!)
            .sort();

        if (genesisDelegates.length !== genesisMilestone.activeDelegates) {
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

        if (state.incomplete) {
            state.complete(genesisDelegates);
        }

        return state;
    }

    public static createNextState<B extends IBlockHeader>(lastState: IState<B>, nextBlock: B): IState<B> {
        try {
            if (!lastState.nextBlockRoundDelegates) {
                throw new CryptoError("Round delegates aren't set.");
            }

            if (nextBlock.previousBlock !== lastState.block.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (nextBlock.height !== lastState.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const nextForgedTransactionCount = lastState.forgedTransactionCount + nextBlock.numberOfTransactions;
            const nextBlockSlot = Slots.getNextBlockSlot(lastState, nextBlock.timestamp);
            const nextBlockForger = Forgers.getNextBlockForger(lastState, nextBlockSlot);

            if (nextBlockSlot.no <= lastState.slot.no) {
                throw new CryptoError("Invalid timestamp.");
            }

            if (nextBlock.generatorPublicKey !== nextBlockForger) {
                throw new CryptoError("Invalid generator public key.");
            }

            let nextJustifiedBlock = lastState.justifiedBlock;
            let nextFinalizedBlock = lastState.finalizedBlock;
            let nextFinalizedDelegates = lastState.finalizedDelegates;
            let nextFinalizedTransactionCount = lastState.finalizedTransactionCount;

            if (nextBlock.version === 1 && Consensus.hasSupermajorityVote(lastState, nextBlock.previousBlockVotes)) {
                nextJustifiedBlock = lastState.block;

                if (nextJustifiedBlock.height === lastState.justifiedBlock.height + 1) {
                    nextFinalizedBlock = lastState.justifiedBlock;
                    nextFinalizedDelegates = lastState.delegates;
                    nextFinalizedTransactionCount =
                        lastState.forgedTransactionCount - lastState.block.numberOfTransactions;
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
                lastState.nextBlockRound,
                lastState.nextBlockRoundDelegates,
            );

            if (nextState.nextBlockRound.no === lastState.nextBlockRound.no) {
                nextState.nextBlockRoundDelegates = lastState.nextBlockRoundDelegates;
                nextState.nextBlockRoundForgers = lastState.nextBlockRoundForgers;
            }

            return nextState;
        } catch (cause) {
            const msg = `Cannot chain new block (height=${nextBlock.height}, id=${nextBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }
}
