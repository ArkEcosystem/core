import { RoundInfo } from "../shared/rounds";
import { Wallet } from "./wallets";
import { Interfaces } from "@arkecosystem/crypto";

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
    getRoundDelegates(): readonly Wallet[];
    revert(blocks: Interfaces.IBlock[], roundInfo: RoundInfo): Promise<void>;
}

export type DposPreviousRoundStateProvider = () => DposPreviousRoundState;
