"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_utils_1 = require("@arkecosystem/core-utils");
const search_entries_1 = require("./utils/search-entries");
class WalletsBusinessRepository {
    constructor(databaseServiceProvider) {
        this.databaseServiceProvider = databaseServiceProvider;
    }
    search(scope, params = {}) {
        let searchContext;
        switch (scope) {
            case core_interfaces_1.Database.SearchScope.Wallets: {
                searchContext = this.searchWallets(params);
                break;
            }
            case core_interfaces_1.Database.SearchScope.Delegates: {
                searchContext = this.searchDelegates(params);
                break;
            }
            case core_interfaces_1.Database.SearchScope.Locks: {
                searchContext = this.searchLocks(params);
                break;
            }
            case core_interfaces_1.Database.SearchScope.Bridgechains: {
                searchContext = this.searchBridgechains(params);
                break;
            }
            case core_interfaces_1.Database.SearchScope.Businesses: {
                searchContext = this.searchBusinesses(params);
                break;
            }
        }
        return search_entries_1.searchEntries(params, searchContext.query, searchContext.entries, searchContext.defaultOrder);
    }
    findById(scope, id) {
        const walletManager = this.databaseServiceProvider().walletManager;
        switch (scope) {
            case core_interfaces_1.Database.SearchScope.Wallets: {
                return walletManager.findByIndex([core_interfaces_1.State.WalletIndexes.Addresses, core_interfaces_1.State.WalletIndexes.PublicKeys, core_interfaces_1.State.WalletIndexes.Usernames], id);
            }
            case core_interfaces_1.Database.SearchScope.Delegates: {
                const wallet = walletManager.findByIndex([core_interfaces_1.State.WalletIndexes.Addresses, core_interfaces_1.State.WalletIndexes.PublicKeys, core_interfaces_1.State.WalletIndexes.Usernames], id);
                if (wallet && wallet.isDelegate()) {
                    return wallet;
                }
                break;
            }
        }
        return undefined;
    }
    count(scope) {
        return this.search(scope, {}).count;
    }
    top(scope, params = {}) {
        return this.search(scope, { ...params, ...{ orderBy: "balance:desc" } });
    }
    searchWallets(params) {
        const query = {
            exact: ["address", "publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance", "lockedBalance"],
        };
        if (params.addresses) {
            // Use the `in` filter instead of `exact` for the `address` field
            if (!params.address) {
                // @ts-ignore
                params.address = params.addresses;
                query.exact.shift();
                query.in = ["address"];
            }
            delete params.addresses;
        }
        return {
            query,
            entries: this.databaseServiceProvider().walletManager.allByAddress(),
            defaultOrder: ["balance", "desc"],
        };
    }
    searchDelegates(params) {
        const query = {
            exact: ["address", "publicKey"],
            like: ["username"],
            between: ["approval", "forgedFees", "forgedRewards", "forgedTotal", "producedBlocks", "voteBalance"],
        };
        if (params.usernames) {
            if (!params.username) {
                params.username = params.usernames;
                query.like.shift();
                query.in = ["username"];
            }
            delete params.usernames;
        }
        let entries;
        switch (params.type) {
            case "resigned": {
                entries = this.databaseServiceProvider()
                    .walletManager.getIndex(core_interfaces_1.State.WalletIndexes.Resignations)
                    .values();
                break;
            }
            case "never-forged": {
                entries = this.databaseServiceProvider()
                    .walletManager.allByUsername()
                    .filter(delegate => {
                    return delegate.getAttribute("delegate.producedBlocks") === 0;
                });
                break;
            }
            default: {
                entries = this.databaseServiceProvider().walletManager.allByUsername();
                break;
            }
        }
        const manipulators = {
            approval: core_utils_1.delegateCalculator.calculateApproval,
            forgedTotal: core_utils_1.delegateCalculator.calculateForgedTotal,
        };
        if (core_utils_1.hasSomeProperty(params, Object.keys(manipulators))) {
            entries = entries.map(delegate => {
                for (const [prop, method] of Object.entries(manipulators)) {
                    if (params.hasOwnProperty(prop)) {
                        delegate.setAttribute(`delegate.${prop}`, method(delegate));
                    }
                }
                return delegate;
            });
        }
        return {
            query,
            entries,
            defaultOrder: ["rank", "asc"],
        };
    }
    searchLocks(params = {}) {
        const query = {
            exact: [
                "expirationType",
                "isExpired",
                "lockId",
                "recipientId",
                "secretHash",
                "senderPublicKey",
                "vendorField",
            ],
            between: ["expirationValue", "amount", "timestamp"],
        };
        if (params.amount !== undefined) {
            params.amount = "" + params.amount;
        }
        const entries = this.databaseServiceProvider()
            .walletManager.getIndex(core_interfaces_1.State.WalletIndexes.Locks)
            .entries()
            .reduce((acc, [lockId, wallet]) => {
            const locks = wallet.getAttribute("htlc.locks");
            if (locks && locks[lockId]) {
                const lock = locks[lockId];
                acc.push({
                    lockId,
                    amount: lock.amount,
                    secretHash: lock.secretHash,
                    senderPublicKey: wallet.publicKey,
                    recipientId: lock.recipientId,
                    timestamp: lock.timestamp,
                    expirationType: lock.expiration.type,
                    expirationValue: lock.expiration.value,
                    isExpired: core_utils_1.expirationCalculator.calculateLockExpirationStatus(lock.expiration),
                    vendorField: lock.vendorField,
                });
            }
            return acc;
        }, []);
        return {
            query,
            entries,
            defaultOrder: ["lockId", "asc"],
        };
    }
    searchBusinesses(params = {}) {
        const query = {
            exact: ["address", "isResigned", "publicKey", "vat"],
            like: ["name", "repository", "website"],
        };
        const entries = this.databaseServiceProvider()
            .walletManager.getIndex("businesses")
            .values()
            .map(wallet => {
            const business = wallet.getAttribute("business");
            return params.transform
                ? {
                    address: wallet.address,
                    publicKey: wallet.publicKey,
                    ...business.businessAsset,
                    isResigned: !!business.resigned,
                }
                : wallet;
        });
        return {
            query,
            entries,
            defaultOrder: ["name", "asc"],
        };
    }
    searchBridgechains(params = {}) {
        const query = {
            exact: ["genesisHash", "isResigned", "publicKey"],
            like: ["bridgechainRepository", "name"],
            every: ["seedNodes"],
        };
        const entries = this.databaseServiceProvider()
            .walletManager.getIndex("businesses")
            .values()
            .reduce((acc, wallet) => {
            const bridgechains = wallet.getAttribute("business.bridgechains") || {};
            acc.push(...Object.values(bridgechains).map(bridgechain => ({
                publicKey: wallet.publicKey,
                address: wallet.address,
                ...bridgechain.bridgechainAsset,
                isResigned: !!bridgechain.resigned,
            })));
            return acc;
        }, []);
        return {
            query,
            entries,
            defaultOrder: ["name", "asc"],
        };
    }
}
exports.WalletsBusinessRepository = WalletsBusinessRepository;
//# sourceMappingURL=wallets-business-repository.js.map