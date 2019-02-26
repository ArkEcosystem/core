const {
    HashAlgorithms,
    Transaction
} = require('@arkecosystem/crypto')
const createHash = require("create-hash");
const nodeSha256 = (bytes) => createHash("sha256").update(bytes).digest()

const data = require('../helpers').getJSONFixture('transaction/deserialized/0');
const transactionBytes = Transaction.toBytes(data);

exports['bcrypto.sha256'] = () => {
    HashAlgorithms.sha256(transactionBytes);
};

exports['node.sha256'] = () => {
    nodeSha256(transactionBytes);
};

exports['bcrypto.sha1'] = () => {
    HashAlgorithms.sha1(transactionBytes);
};

exports['node.sha1'] = () => {
    createHash("sha1").update(transactionBytes).digest();
};

exports['bcrypto.ripemd160'] = () => {
    HashAlgorithms.ripemd160(transactionBytes);
};

exports['node.ripemd160'] = () => {
    createHash("ripemd160").update(transactionBytes).digest();
};

exports['bcrypto.hash160'] = () => {
    HashAlgorithms.hash160(transactionBytes);
};

exports['node.hash160'] = () => {
    createHash("ripemd160").update(nodeSha256(transactionBytes)).digest();
};

exports['bcrypto.hash256'] = () => {
    HashAlgorithms.hash256(transactionBytes);
};

exports['node.hash256'] = () => {
    nodeSha256(nodeSha256(transactionBytes));
};