const {
    deserialize
} = require('./methods')

const data = require('../../helpers').getFixture('transaction/serialized/0.txt');

exports['core'] = () => {
    return deserialize(data);
};
