import { configManager } from "../managers";

let genesisTransactions: { [key: string]: boolean };
let currentNetwork: number;

export const isGenesisTransaction = (id: string): boolean => {
    const network = configManager.get("pubKeyHash");
    if (!genesisTransactions || currentNetwork !== network) {
        currentNetwork = network;
        genesisTransactions = configManager
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.id]: true }), {});
    }

    return genesisTransactions[id];
};
