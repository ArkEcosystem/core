import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import Accounts from './accounts'
import Blocks from './blocks'
import Delegates from './delegates'
import Loader from './loader'
import Peers from './peers'
import Signatures from './signatures'
import Transactions from './transactions'

const mock = new MockAdapter(axios)

Accounts(mock)
Blocks(mock)
Delegates(mock)
Loader(mock)
Peers(mock)
Signatures(mock)
Transactions(mock)
