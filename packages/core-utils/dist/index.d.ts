import { CappedSet } from "./capped-set";
import { formatTimestamp } from "./format-timestamp";
import { hasSomeProperty } from "./has-some-property";
import { httpie, IHttpieResponse } from "./httpie";
import { isBlockChained } from "./is-block-chained";
import { isWhitelisted } from "./is-whitelisted";
import { NSect } from "./nsect";
import { OrderedCappedMap } from "./ordered-capped-map";
import { SortedArray } from "./sorted-array";
import * as Plugins from "./transform-plugins";
import { Tree } from "./tree";
export declare const delegateCalculator: {
    calculateApproval: (delegate: import("@arkecosystem/core-interfaces/dist/core-state").IWallet, height?: number) => number;
    calculateForgedTotal: (wallet: import("@arkecosystem/core-interfaces/dist/core-state").IWallet) => string;
};
export declare const expirationCalculator: {
    calculateTransactionExpiration: (transaction: import("@arkecosystem/crypto/dist/interfaces").ITransactionData, context: {
        blockTime: number;
        currentHeight: number;
        now: number;
        maxTransactionAge: number;
    }) => number;
    calculateLockExpirationStatus: (expiration: import("@arkecosystem/crypto/dist/interfaces").IHtlcExpiration) => boolean;
};
export declare const roundCalculator: {
    calculateRound: (height: number) => import("@arkecosystem/core-interfaces/dist/shared").IRoundInfo;
    isNewRound: (height: number) => boolean;
};
export declare const supplyCalculator: {
    calculate: (height: number) => string;
};
export { CappedSet, formatTimestamp, hasSomeProperty, httpie, IHttpieResponse, isBlockChained, isWhitelisted, NSect, OrderedCappedMap, Plugins, Tree, SortedArray, };
