const {
    deserialize
} = require('./methods')

const data = require('../../helpers').getFixture('block/serialized/no-transactions.txt');

exports['core'] = () => {
    return deserialize(data);
};
