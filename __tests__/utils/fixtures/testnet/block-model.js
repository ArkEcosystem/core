"use strict";
exports.__esModule = true;
var crypto_1 = require("@arkecosystem/crypto");
var genesisBlock_1 = require("../../config/testnet/genesisBlock");
crypto_1.Managers.configManager.setFromPreset("testnet");
crypto_1.Managers.configManager.getMilestone().aip11 = false;
exports.genesisBlock = crypto_1.Blocks.BlockFactory.fromData(genesisBlock_1.genesisBlock);
crypto_1.Managers.configManager.getMilestone().aip11 = true;
