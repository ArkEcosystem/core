const {
    TransactionSerializer
} = require('@arkecosystem/crypto')

const data = require('../../helpers').getJSONFixture('transaction/deserialized/0');

exports['core'] = () => {
    return TransactionSerializer.getBytes(data);
};
