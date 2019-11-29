const {
    Blocks,
    Managers,
} = require('@arkecosystem/crypto')

const dataEmpty = require('../helpers').getJSONFixture('block/deserialized/no-transactions');
const dataFull = require('../helpers').getJSONFixture('block/deserialized/transactions');
const dataMultipayments1MB = require('../helpers').getJSONFixture('block/deserialized/multipayments-1MB');
const dataMultipayments150 = require('../helpers').getJSONFixture('block/deserialized/multipayments-150');
const dataMultipayments500 = require('../helpers').getJSONFixture('block/deserialized/multipayments-500');
const serializedEmpty = require('../helpers').getFixture('block/serialized/no-transactions.txt');
const serializedFull = require('../helpers').getFixture('block/serialized/transactions.txt');

exports['fromData (0)'] = () => {
    return Blocks.BlockFactory.fromData(dataEmpty);
};

exports['fromData (150)'] = () => {
    return Blocks.BlockFactory.fromData(dataFull);
};

exports['fromData (150 Multipayments, 1MB)'] = () => {
    try {
        Managers.configManager.getMilestone().aip11 = true;
        return Blocks.BlockFactory.fromData(dataMultipayments1MB);
    } finally {
        Managers.configManager.getMilestone().aip11 = false;
    }
};

exports['fromData (150 Multipayments, 150 Recipients each)'] = () => {
    try {
        Managers.configManager.getMilestone().aip11 = true;
        return Blocks.BlockFactory.fromData(dataMultipayments150);
    } finally {
        Managers.configManager.getMilestone().aip11 = false;
    }
};

exports['fromData (150 Multipayments, 500 Recipients each)'] = () => {
    try {
        Managers.configManager.getMilestone().aip11 = true;
        return Blocks.BlockFactory.fromData(dataMultipayments500);
    } finally {
        Managers.configManager.getMilestone().aip11 = false;
    }
};

exports['fromHex (0)'] = () => {
    return Blocks.BlockFactory.fromHex(serializedEmpty);
};

exports['fromHex (150)'] = () => {
    return Blocks.BlockFactory.fromHex(serializedFull);
};
