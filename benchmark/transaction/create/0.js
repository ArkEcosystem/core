const {
    Transactions
} = require('@arkecosystem/crypto')

const data = require('../../helpers').getJSONFixture('transaction/deserialized/0');
const serializedHex = require('../../helpers').getFixture('transaction/serialized/0.txt');
const serializedBytes = Buffer.from(serializedHex, "hex");

exports['fromData'] = () => {
    return Transactions.TransactionFactory.fromData(data);
};

exports['fromHex'] = () => {
    return Transactions.TransactionFactory.fromHex(serializedHex);
};

exports['fromBytes'] = () => {
    return Transactions.TransactionFactory.fromBytes(serializedBytes);
};

exports['fromBytesUnsafe'] = () => {
    return Transactions.TransactionFactory.fromBytesUnsafe(serializedBytes, data.id);
};
