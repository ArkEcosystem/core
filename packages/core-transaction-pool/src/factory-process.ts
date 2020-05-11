import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

const loadedCryptoPackages: string[] = [];

const sendTransactionFromDataSuccess = (id: number, tx: Interfaces.ITransaction): void => {
    const response: Contracts.TransactionPool.TransactionFromDataSuccess = {
        type: Contracts.TransactionPool.ActionType.TransactionFromDataSuccess,
        id,
        payload: {
            id: tx.id!,
            serialized: tx.serialized.toString("hex"),
        },
    };

    process.send!(response);
};

const sendTransactionFromDataError = (id: number, message: string): void => {
    const response: Contracts.TransactionPool.TransactionFromDataError = {
        type: Contracts.TransactionPool.ActionType.TransactionFromDataError,
        id: id,
        error: {
            message,
        },
    };

    process.send!(response);
};

const loadCryptoPackage = (action: Contracts.TransactionPool.LoadCryptoPackageAction) => {
    if (!loadedCryptoPackages.includes(action.payload.packageName)) {
        loadedCryptoPackages.push(action.payload.packageName);

        if (require.resolve(action.payload.packageName)) {
            const pkgTransactions = require(action.payload.packageName).Transactions;
            for (const txConstructor of Object.values(pkgTransactions)) {
                Transactions.TransactionRegistry.registerTransactionType(txConstructor as any);
            }
        }
    }
};

const setNetworkConfig = (action: Contracts.TransactionPool.SetNetworkConfigAction) => {
    Managers.configManager.setConfig(action.payload.networkConfig);
};

const setHeight = (action: Contracts.TransactionPool.SetHeightAction) => {
    Managers.configManager.setHeight(action.payload.height);
};

const setMilestone = (action: Contracts.TransactionPool.SetMilestoneAction) => {
    const milestone = Managers.configManager.getMilestone();
    Object.assign(milestone, action.payload.milestoneData);
};

const requestTransactionFromData = (action: Contracts.TransactionPool.TransactionFromDataRequest) => {
    try {
        const tx = Transactions.TransactionFactory.fromData(action.payload.transactionData);
        sendTransactionFromDataSuccess(action.id, tx);
    } catch (error) {
        sendTransactionFromDataError(action.id, error.message);
    }
};

process.on("message", (action: Contracts.TransactionPool.FactoryAction) => {
    switch (action.type) {
        case Contracts.TransactionPool.ActionType.LoadCryptoPackage:
            return loadCryptoPackage(action);
        case Contracts.TransactionPool.ActionType.SetNetworkConfig:
            return setNetworkConfig(action);
        case Contracts.TransactionPool.ActionType.SetHeight:
            return setHeight(action);
        case Contracts.TransactionPool.ActionType.SetMilestone:
            return setMilestone(action);
        case Contracts.TransactionPool.ActionType.TransactionFromDataRequest:
            return requestTransactionFromData(action);
    }

    console.error(`Unexpected IPC message`, action);
});
