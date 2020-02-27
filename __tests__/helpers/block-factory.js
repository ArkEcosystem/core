"use strict";
exports.__esModule = true;
var core_forger_1 = require("@arkecosystem/core-forger");
var crypto_1 = require("@arkecosystem/crypto");
var unitnet_1 = require("../utils/fixtures/unitnet");
var BlockFactory = /** @class */ (function () {
    function BlockFactory() {
    }
    BlockFactory.createDummy = function (transactions) {
        if (transactions === void 0) { transactions = []; }
        var delegate = new core_forger_1.Delegate(unitnet_1.delegates[0].passphrase, crypto_1.Networks.unitnet.network);
        return delegate.forge(transactions, {
            timestamp: 12345689,
            previousBlock: {
                id: unitnet_1.genesisBlock.id,
                height: 1
            },
            reward: crypto_1.Utils.BigNumber.ZERO
        });
    };
    return BlockFactory;
}());
exports.BlockFactory = BlockFactory;
