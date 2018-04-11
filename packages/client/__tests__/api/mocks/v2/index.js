import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import Blocks from './blocks'
import Delegates from './delegates'
import Node from './node'
import Peers from './peers'
import Statistics from './statistics'
import Transactions from './transactions'
import Votes from './votes'
import Wallets from './wallets'
import Webhooks from './webhooks'

const mock = new MockAdapter(axios)

Blocks(mock)
Delegates(mock)
Node(mock)
Peers(mock)
Statistics(mock)
Transactions(mock)
Votes(mock)
Wallets(mock)
Webhooks(mock)
