import { Utils } from "@arkecosystem/crypto";

const genesisBlock = require("./genesisBlock.json");
genesisBlock.totalAmount = Utils.BigNumber.make(genesisBlock.totalAmount);
genesisBlock.totalFee = Utils.BigNumber.make(genesisBlock.totalFee);
genesisBlock.reward = Utils.BigNumber.make(genesisBlock.reward);

for (const transaction of genesisBlock.transactions) {
    transaction.nonce = Utils.BigNumber.make(transaction.nonce);
    transaction.fee = Utils.BigNumber.make(transaction.fee);
    transaction.amount = Utils.BigNumber.make(transaction.amount);
}

export { genesisBlock };
