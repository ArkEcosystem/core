"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MagistrateIndex;
(function (MagistrateIndex) {
    MagistrateIndex["Businesses"] = "businesses";
})(MagistrateIndex = exports.MagistrateIndex || (exports.MagistrateIndex = {}));
exports.businessIndexer = (index, wallet) => {
    if (wallet.hasAttribute("business")) {
        const business = wallet.getAttribute("business");
        if (business !== undefined && !business.resigned) {
            index.set(wallet.publicKey, wallet);
        }
    }
};
//# sourceMappingURL=wallet-manager.js.map