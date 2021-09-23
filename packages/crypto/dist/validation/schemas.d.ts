export declare const schemas: {
    hex: {
        $id: string;
        type: string;
        pattern: string;
    };
    base58: {
        $id: string;
        type: string;
        pattern: string;
    };
    alphanumeric: {
        $id: string;
        type: string;
        pattern: string;
    };
    transactionId: {
        $id: string;
        allOf: ({
            minLength: number;
            maxLength: number;
            $ref?: undefined;
        } | {
            $ref: string;
            minLength?: undefined;
            maxLength?: undefined;
        })[];
    };
    networkByte: {
        $id: string;
        network: boolean;
    };
    address: {
        $id: string;
        allOf: ({
            minLength: number;
            maxLength: number;
            $ref?: undefined;
        } | {
            $ref: string;
            minLength?: undefined;
            maxLength?: undefined;
        })[];
    };
    publicKey: {
        $id: string;
        allOf: ({
            minLength: number;
            maxLength: number;
            $ref?: undefined;
            transform?: undefined;
        } | {
            $ref: string;
            minLength?: undefined;
            maxLength?: undefined;
            transform?: undefined;
        } | {
            transform: string[];
            minLength?: undefined;
            maxLength?: undefined;
            $ref?: undefined;
        })[];
    };
    walletVote: {
        $id: string;
        allOf: ({
            type: string;
            pattern: string;
            transform?: undefined;
        } | {
            transform: string[];
            type?: undefined;
            pattern?: undefined;
        })[];
    };
    username: {
        $id: string;
        allOf: ({
            type: string;
            pattern: string;
            minLength?: undefined;
            maxLength?: undefined;
            transform?: undefined;
        } | {
            minLength: number;
            maxLength: number;
            type?: undefined;
            pattern?: undefined;
            transform?: undefined;
        } | {
            transform: string[];
            type?: undefined;
            pattern?: undefined;
            minLength?: undefined;
            maxLength?: undefined;
        })[];
    };
    genericName: {
        $id: string;
        allOf: ({
            type: string;
            pattern: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            minLength: number;
            maxLength: number;
            type?: undefined;
            pattern?: undefined;
        })[];
    };
    uri: {
        $id: string;
        allOf: ({
            format: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            minLength: number;
            maxLength: number;
            format?: undefined;
        })[];
    };
    blockHeader: {
        $id: string;
        type: string;
        required: string[];
        properties: {
            id: {
                blockId: {};
            };
            idHex: {
                blockId: {};
            };
            version: {
                type: string;
                minimum: number;
            };
            timestamp: {
                type: string;
                minimum: number;
            };
            previousBlock: {
                blockId: {
                    allowNullWhenGenesis: boolean;
                    isPreviousBlock: boolean;
                };
            };
            previousBlockHex: {
                blockId: {
                    allowNullWhenGenesis: boolean;
                    isPreviousBlock: boolean;
                };
            };
            height: {
                type: string;
                minimum: number;
            };
            numberOfTransactions: {
                type: string;
            };
            totalAmount: {
                bignumber: {
                    minimum: number;
                    bypassGenesis: boolean;
                    block: boolean;
                };
            };
            totalFee: {
                bignumber: {
                    minimum: number;
                    bypassGenesis: boolean;
                    block: boolean;
                };
            };
            reward: {
                bignumber: {
                    minimum: number;
                };
            };
            payloadLength: {
                type: string;
                minimum: number;
            };
            payloadHash: {
                $ref: string;
            };
            generatorPublicKey: {
                $ref: string;
            };
            blockSignature: {
                $ref: string;
            };
        };
    };
    block: {
        $id: string;
        $ref: string;
        properties: {
            transactions: {
                $ref: string;
                minItems: {
                    $data: string;
                };
                maxItems: {
                    $data: string;
                };
            };
        };
    };
};
