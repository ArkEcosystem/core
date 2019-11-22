import memoize from "fast-memoize";
import { SATOSHI } from "../constants";
import { configManager } from "../managers/config";
import { Base58 } from "./base58";
import { BigNumber } from "./bignum";
import { isLocalHost, isValidPeer } from "./is-valid-peer";

const getExceptionIds = memoize(_ => {
    const s = new Set<string>();
    const blockIds = configManager.get("exceptions.blocks") || [];
    const transactionIds = configManager.get("exceptions.transactions") || [];
    for (const blockId of blockIds) {
        s.add(blockId);
    }
    for (const transactionId of transactionIds) {
        s.add(transactionId);
    }
    return s;
});

const getGenesisTransactionIds = memoize(_ => {
    const s = new Set<string>();
    const genesisTransactions = configManager.get("genesisBlock.transactions") || [];
    for (const transaction of genesisTransactions) {
        s.add(transaction.id);
    }
    return s;
});

/**
 * Get human readable string from satoshis
 */
export const formatSatoshi = (amount: BigNumber): string => {
    const localeString = (+amount / SATOSHI).toLocaleString("en", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return `${localeString} ${configManager.get("network.client.symbol")}`;
};

/**
 * Check if the given block or transaction id is an exception.
 */
export const isException = (blockOrTransaction: { id?: string }): boolean => {
    const network: number = configManager.get("network.pubKeyHash");
    return getExceptionIds(network).has(blockOrTransaction.id);
};

export const isGenesisTransaction = (id: string): boolean => {
    const network: number = configManager.get("network.pubKeyHash");
    return getGenesisTransactionIds(network).has(id);
};

export const isNegativeBalanceException = (
    senderPublicKey: string,
    nonce: BigNumber,
    newBalance: BigNumber,
): boolean => {
    const byPublicKey: Record<string, Record<string, string>> = configManager.get("exceptions.negativeBalances");
    if (!byPublicKey) {
        return false;
    }
    const byNonce: Record<string, string> = byPublicKey[senderPublicKey];
    if (!byNonce) {
        return false;
    }
    const expectedBalance = byNonce[nonce.toString()];
    if (!expectedBalance) {
        return false;
    }
    return newBalance.isEqualTo(expectedBalance);
};

export const numberToHex = (num: number, padding = 2): string => {
    const indexHex: string = Number(num).toString(16);

    return "0".repeat(padding - indexHex.length) + indexHex;
};

export const maxVendorFieldLength = (height?: number): number => configManager.getMilestone(height).vendorFieldLength;

export const isSupportedTansactionVersion = (version: number): boolean => {
    const aip11: boolean = configManager.getMilestone().aip11;

    if (aip11 && version !== 2) {
        return false;
    }

    if (!aip11 && version !== 1) {
        return false;
    }

    return true;
};

export { Base58, BigNumber, isValidPeer, isLocalHost };
