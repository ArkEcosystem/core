import { Interfaces } from "@arkecosystem/crypto";

import { RoundInfo } from "../shared/rounds";
import { Wallet } from "./wallets";

export interface DposState {
    getRoundInfo(): RoundInfo;
    getAllDelegates(): readonly Wallet[];
    getActiveDelegates(): readonly Wallet[];
    getRoundDelegates(): readonly Wallet[];
    buildVoteBalances(): void;
    buildDelegateRanking(): void;
    setDelegatesRound(roundInfo: RoundInfo): void;
}

export interface DposPreviousRoundState {
    getAllDelegates(): readonly Wallet[];
    getActiveDelegates(): readonly Wallet[];
    getRoundDelegates(): readonly Wallet[];
}

export type DposPreviousRoundStateProvider = (
    revertBlocks: Interfaces.IBlock[],
    roundInfo: RoundInfo,
) => Promise<DposPreviousRoundState>;
