import { Enums, Interfaces } from "@arkecosystem/crypto";

export interface FactoryPool {
    isTypeGroupSupported(typeGroup: Enums.TransactionTypeGroup): boolean;
    getTransactionFromData(transactionData: Interfaces.ITransactionData): Promise<Interfaces.ITransaction>;
}

export interface FactoryWorker {
    getQueueSize(): number;
    getTransactionFromData(transactionData: Interfaces.ITransactionData): Promise<Interfaces.ITransaction>;
}

export type FactoryWorkerFactory = () => FactoryWorker;

export enum ActionType {
    LoadCryptoPackage = "CRYPTO_PACKAGE_LOAD",

    SetNetworkConfig = "NETWORK_CONFIG_SET",
    SetHeight = "HEIGHT_SET",
    SetMilestone = "MILESTONE_SET",

    TransactionFromDataRequest = "TRANSACTION_FROM_DATA_REQUEST",
    TransactionFromDataSuccess = "TRANSACTION_FROM_DATA_SUCCESS",
    TransactionFromDataError = "TRANSACTION_FROM_DATA_ERROR",
}

export type LoadCryptoPackageAction = {
    type: ActionType.LoadCryptoPackage;
    payload: {
        packageName: string;
    };
};

export type SetNetworkConfigAction = {
    type: ActionType.SetNetworkConfig;
    payload: {
        networkConfig: any;
    };
};

export type SetHeightAction = {
    type: ActionType.SetHeight;
    payload: {
        height: number;
    };
};

export type SetMilestoneAction = {
    type: ActionType.SetMilestone;
    payload: {
        milestoneData: Interfaces.IMilestone["data"];
    };
};

export type TransactionFromDataRequest = {
    id: number;
    type: ActionType.TransactionFromDataRequest;
    payload: {
        transactionData: Interfaces.ITransactionData;
    };
};

export type TransactionFromDataSuccess = {
    id: number;
    type: ActionType.TransactionFromDataSuccess;
    payload: {
        id: string;
        serialized: string;
    };
};

export type TransactionFromDataError = {
    id: number;
    type: ActionType.TransactionFromDataError;
    error: {
        message: string;
    };
};

export type TransactionFromDataResponse = TransactionFromDataSuccess | TransactionFromDataError;

export type FactoryAction =
    | LoadCryptoPackageAction
    | SetNetworkConfigAction
    | SetHeightAction
    | SetMilestoneAction
    | TransactionFromDataRequest
    | TransactionFromDataSuccess
    | TransactionFromDataError;
