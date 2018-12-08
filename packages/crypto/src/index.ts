import client from "./client"

import Block from "./models/block"
import Delegate from "./models/delegate"
import Transaction from "./models/transaction"
import Wallet from "./models/wallet"

const models = {
  Block, Delegate, Transaction, Wallet
}

import transactionBuilder from "./builder"

// Identities
import address from "./identities/address"
import keys from "./identities/keys"
import privateKey from "./identities/private-key"
import publicKey from "./identities/public-key"
import wif from "./identities/wif"

const identities = {
  address, keys, privateKey, publicKey, wif
}

// Managers
import configManager from "./managers/config"
import dynamicFeeManager from "./managers/dynamic-fee"
import feeManager from "./managers/fee"
import NetworkManager from "./managers/network"

// Constants
import * as constants from "./constants"

export * from "./utils"
export * from "./validation"
export * from "./crypto"
export * from "./client"

export {
  client,
  models,
  identities,
  transactionBuilder,
  configManager,
  feeManager,
  NetworkManager,
  dynamicFeeManager,
  constants
}
