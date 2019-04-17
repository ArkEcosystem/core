const {
    Transaction
} = require('@arkecosystem/crypto')

const data = require('../../helpers').getJSONFixture('transaction/deserialized/0');
const serializedHex = require('../../helpers').getFixture('transaction/serialized/0.txt');
const serializedBytes = Buffer.from(serializedHex, "hex");

exports['fromData'] = () => {
    return TransactionFactory.fromData(data);
};

exports['fromHex'] = () => {
    return TransactionFactory.fromHex(serializedHex);
};

exports['fromBytes'] = () => {
    return TransactionFactory.fromBytes(serializedBytes);
};

exports['fromBytesUnsafe'] = () => {
    return TransactionFactory.fromBytesUnsafe(serializedBytes, data.id);
};
