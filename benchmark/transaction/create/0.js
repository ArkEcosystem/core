const {
    Transaction
} = require('@arkecosystem/crypto')

const data = require('../../helpers').getJSONFixture('transaction/deserialized/0');
const serializedHex = require('../../helpers').getFixture('transaction/serialized/0.txt');
const serializedBytes = Buffer.from(serializedHex, "hex");

exports['fromData'] = () => {
    return Transaction.fromData(data);
};

exports['fromHex'] = () => {
    return Transaction.fromHex(serializedHex);
};

exports['fromBytes'] = () => {
    return Transaction.fromBytes(serializedBytes);
};

exports['fromBytesUnsafe'] = () => {
    return Transaction.fromBytesUnsafe(serializedBytes, data.id);
};
