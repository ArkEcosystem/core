"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const utils_1 = require("@arkecosystem/utils");
const dottie_1 = __importDefault(require("dottie"));
const get_property_1 = require("./get-property");
exports.sortEntries = (params, entries, defaultOrder) => {
    const [iteratee, order] = params.orderBy ? params.orderBy : defaultOrder;
    if ([
        "amount",
        "balance",
        "fee",
        "forgedFees",
        "forgedRewards",
        "lockedBalance",
        "nonce",
        "totalAmount",
        "totalFee",
        "voteBalance",
    ].includes(iteratee)) {
        return Object.values(entries).sort((a, b) => {
            const iterateeA = get_property_1.getProperty(a, iteratee) || crypto_1.Utils.BigNumber.ZERO;
            const iterateeB = get_property_1.getProperty(b, iteratee) || crypto_1.Utils.BigNumber.ZERO;
            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }
    return utils_1.orderBy(entries, (entry) => {
        if (typeof iteratee === "function") {
            // @ts-ignore
            return iteratee(entry);
        }
        if (dottie_1.default.exists(entry, iteratee)) {
            return dottie_1.default.get(entry, iteratee);
        }
        const delegateAttribute = `attributes.delegate.${iteratee}`;
        if (dottie_1.default.exists(entry, delegateAttribute)) {
            return dottie_1.default.get(entry, delegateAttribute);
        }
        return dottie_1.default.get(entry, `attributes.${iteratee}`);
    }, [order]);
};
//# sourceMappingURL=sort-entries.js.map