import { BigNumber } from "../utils";
import { ISchnorrMultiSignature } from ".";
import { IBlock, IBlockHeader } from "./block";

export type IHeaderState = IState<IBlockHeader>;

export type ISlot = {
    readonly no: number;
    readonly timestamp: number;
    readonly duration: number;
};

export type IRound = {
    readonly no: number;
    readonly height: number;
    readonly length: number;
};

export type IDelegate = {
    readonly publicKey: string;
    readonly balance: BigNumber;
};

export type IVoteContent = {
    readonly justifiedHeight: number;
    readonly justifiedBlockId: string;

    readonly lastHeight: number;
    readonly lastBlockId: string;
};

export type IStateData<B extends IBlockHeader = IBlock> = {
    readonly forgedTransactionCount: number;
    readonly finalizedTransactionCount: number;
    readonly finalizedValidators: readonly string[];

    readonly finalizedBlock: B;
    readonly justifiedBlock: B;

    readonly lastBlock: B;
    readonly lastSlot: ISlot;
    readonly lastValidators: readonly string[];

    readonly currentRound: IRound;
    readonly currentDelegates: readonly IDelegate[];
    readonly currentValidators: readonly string[];
    readonly currentForgers: readonly string[];
};

export type ITransitionStateData<B extends IBlockHeader = IBlock> = {
    readonly forgedTransactionCount: number;
    readonly finalizedTransactionCount: number;
    readonly finalizedValidators: readonly string[];

    readonly finalizedBlock: B;
    readonly justifiedBlock: B;

    readonly currentBlock: B;
    readonly currentSlot: ISlot;
    readonly currentRound: IRound;
    readonly currentDelegates: readonly IDelegate[];
    readonly currentValidators: readonly string[];
    readonly currentForgers: readonly string[];
};

export interface IState<B extends IBlockHeader = IBlock> extends IStateData<B> {
    hasUnfinalizedTransactions(): boolean;
    hasUnfinalizedValidators(): boolean;

    getValidators(): readonly string[];
    getVoteContent(): IVoteContent;
    isLastBlockJustified(votes: readonly ISchnorrMultiSignature[]): boolean;

    getCurrentSlot(timestamp: number): ISlot;
    getCurrentForger(slot: ISlot): string;

    chainBlock(block: B): ITransitionState<B>;
}

export interface ITransitionState<B extends IBlockHeader = IBlock> extends ITransitionStateData<B> {
    readonly nextHeightRound: IRound;

    continueCurrentRound(): IState<B>;
    startNewRound(newDelegates: readonly IDelegate[]): IState<B>;
}
