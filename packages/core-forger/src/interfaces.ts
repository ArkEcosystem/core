import { Nes } from "@arkecosystem/core-p2p";
import { Interfaces } from "@arkecosystem/crypto";

/**
 * @export
 * @interface RelayHost
 */
export interface RelayHost {
    /**
     * @type {string}
     * @memberof RelayHost
     */
    hostname: string;

    /**
     * @type {number}
     * @memberof RelayHost
     */
    port: number;

    /**
     * @type {Nes.Client}
     * @memberof RelayHost
     */
    socket?: Nes.Client;
}

/**
 * @export
 * @interface Delegate
 */
export interface Delegate {
    /**
     * @type {Interfaces.IKeyPair}
     * @memberof Delegate
     */
    keys: Interfaces.IKeyPair | undefined;

    /**
     * @type {string}
     * @memberof Delegate
     */
    publicKey: string;

    /**
     * @type {string}
     * @memberof Delegate
     */
    address: string;

    /**
     * @param {Interfaces.ITransactionData[]} transactions
     * @param {Record<string, any>} options
     * @returns {Interfaces.IBlock}
     * @memberof Delegate
     */
    forge(transactions: Interfaces.ITransactionData[], options: Record<string, any>): Interfaces.IBlock;
}
