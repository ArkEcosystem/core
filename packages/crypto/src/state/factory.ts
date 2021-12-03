import { BlockFactory } from "../blocks";
import { TransactionType, TransactionTypeGroup } from "../enums";
import { IBlock, IGenesisBlockJson, ITransitionState } from "../interfaces";
import { configManager } from "../managers";
import { BigNumber } from "../utils";
import { TransitionState } from "./transition-state";
import { Utils } from "./utils";

export class StateFactory {
    public static createGenesisState(): ITransitionState<IBlock> {
        const genesisBlockJson = configManager.get("genesisBlock") as IGenesisBlockJson;
        const genesisBlock = BlockFactory.createGenesisBlock(genesisBlockJson);
        const genesisMilestone = configManager.getMilestone(genesisBlock.height);
        const genesisRound = { no: 1, height: 1, length: genesisMilestone.activeDelegates };
        const genesisSlot = { no: 0, timestamp: 0, duration: genesisMilestone.blocktime };
        const genesisDelegates = genesisBlock.transactions
            .filter((t) => t.typeGroup === TransactionTypeGroup.Core)
            .filter((t) => t.type === TransactionType.DelegateRegistration)
            .map((t) => ({ publicKey: t.data.senderPublicKey!, balance: BigNumber.ZERO }))
            .sort((a, b) => a.publicKey.localeCompare(b.publicKey));

        if (genesisDelegates.length !== genesisMilestone.activeDelegates) {
            throw new Error("Invalid genesis block.");
        }

        const genesisForgers = Utils.getRoundShuffledForgers(genesisRound, genesisDelegates);
        const genesisValidators = genesisDelegates.map((d) => d.publicKey);

        return new TransitionState({
            finalizedTransactionCount: genesisBlock.numberOfTransactions,
            forgedTransactionCount: genesisBlock.numberOfTransactions,
            finalizedValidators: genesisValidators,

            finalizedBlock: genesisBlock,
            justifiedBlock: genesisBlock,

            currentBlock: genesisBlock,
            currentSlot: genesisSlot,
            currentRound: genesisRound,
            currentDelegates: genesisDelegates,
            currentValidators: genesisValidators,
            currentForgers: genesisForgers,
        });
    }
}
