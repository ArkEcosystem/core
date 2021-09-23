export declare const requestSchemas: {
    peer: {
        getPeers: {
            type: string;
            maxProperties: number;
        };
        getCommonBlocks: {
            type: string;
            required: string[];
            additionalProperties: boolean;
            properties: {
                ids: {
                    type: string;
                    additionalItems: boolean;
                    minItems: number;
                    maxItems: number;
                    items: {
                        blockId: {};
                    };
                };
            };
        };
        getStatus: {
            type: string;
            maxProperties: number;
        };
        getBlocks: {
            type: string;
            required: string[];
            additionalProperties: boolean;
            properties: {
                lastBlockHeight: {
                    type: string;
                    minimum: number;
                };
                blockLimit: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                headersOnly: {
                    type: string;
                };
                serialized: {
                    type: string;
                };
            };
        };
        postBlock: {
            type: string;
            required: string[];
            additionalProperties: boolean;
            properties: {
                block: {
                    instanceof: string;
                };
            };
        };
        postTransactions: {
            type: string;
            required: string[];
            additionalProperties: boolean;
            properties: {
                transactions: {
                    $ref: string;
                    minItems: number;
                    maxItems: any;
                };
            };
        };
    };
    internal: {
        emitEvent: {
            type: string;
            required: string[];
            additionalProperties: boolean;
            properties: {
                event: {
                    type: string;
                };
                body: {
                    type: string;
                };
            };
        };
    };
};
export declare const replySchemas: {
    "p2p.peer.getBlocks": {
        type: string;
        maxItems: number;
        items: {
            $ref: string;
        };
    };
    "p2p.peer.getCommonBlocks": {
        type: string;
        additionalProperties: boolean;
        properties: {
            common: {
                anyOf: ({
                    type: string;
                    properties: {
                        height: {
                            type: string;
                            minimum: number;
                        };
                        id: {
                            blockId: {};
                        };
                    };
                    required: string[];
                } | {
                    type: string;
                    properties?: undefined;
                    required?: undefined;
                })[];
            };
        };
        required: string[];
    };
    "p2p.peer.getPeers": {
        type: string;
        maxItems: number;
        items: {
            type: string;
            properties: {
                ip: {
                    anyOf: {
                        type: string;
                        format: string;
                    }[];
                };
            };
            required: string[];
        };
    };
    "p2p.peer.getStatus": {
        type: string;
        required: string[];
        additionalProperties: boolean;
        properties: {
            state: {
                type: string;
                required: string[];
                properties: {
                    height: {
                        type: string;
                        minimum: number;
                    };
                    forgingAllowed: {
                        type: string;
                    };
                    currentSlot: {
                        type: string;
                        minimum: number;
                    };
                    header: {
                        anyOf: ({
                            $ref: string;
                            type?: undefined;
                            minProperties?: undefined;
                            maxProperties?: undefined;
                        } | {
                            type: string;
                            minProperties: number;
                            maxProperties: number;
                            $ref?: undefined;
                        })[];
                    };
                };
            };
            config: {
                type: string;
                required: string[];
                additionalProperties: boolean;
                properties: {
                    version: {
                        type: string;
                        minLength: number;
                        maxLength: number;
                    };
                    network: {
                        type: string;
                        required: string[];
                        additionalProperties: boolean;
                        properties: {
                            name: {
                                type: string;
                                minLength: number;
                                maxLength: number;
                            };
                            version: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            nethash: {
                                allOf: ({
                                    $ref: string;
                                    minLength?: undefined;
                                    maxLength?: undefined;
                                } | {
                                    minLength: number;
                                    maxLength: number;
                                    $ref?: undefined;
                                })[];
                            };
                            explorer: {
                                type: string;
                                minLength: number;
                                maxLength: number;
                            };
                            token: {
                                type: string;
                                required: string[];
                                additionalProperties: boolean;
                                properties: {
                                    name: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                    symbol: {
                                        type: string;
                                        minLength: number;
                                        maxLength: number;
                                    };
                                };
                            };
                        };
                    };
                    plugins: {
                        type: string;
                        maxProperties: number;
                        minProperties: number;
                        additionalProperties: boolean;
                        patternProperties: {
                            "^.{4,64}$": {
                                type: string;
                                required: string[];
                                additionalProperties: boolean;
                                properties: {
                                    port: {
                                        type: string;
                                        minimum: number;
                                        maximum: number;
                                    };
                                    enabled: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    "p2p.peer.postBlock": {
        type: string;
    };
    "p2p.peer.postTransactions": {
        type: string;
    };
};
