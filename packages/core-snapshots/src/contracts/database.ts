import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import * as Meta from "./meta-data";
import * as Options from "./options";

export interface DumpRange {
    firstBlockHeight: number;
    lastBlockHeight: number;
    blocksCount: number;

    firstTransactionTimestamp: number;
    lastTransactionTimestamp: number;
    transactionsCount: number;

    firstRoundRound: number;
    lastRoundRound: number;
    roundsCount: number;
}

export interface DatabaseService {
    init(codec?: string, skipCompression?: boolean, verify?: boolean): void;
    truncate(): Promise<void>;
    rollback(roundInfo: Contracts.Shared.RoundInfo): Promise<Interfaces.IBlock>;
    dump(options: Options.DumpOptions): Promise<void>;
    restore(meta: Meta.MetaData, options: Options.RestoreOptions): Promise<void>;
    verify(meta: Meta.MetaData): Promise<void>;
    getLastBlock(): Promise<Interfaces.IBlock>;
}
