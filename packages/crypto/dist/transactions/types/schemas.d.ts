export declare const transactionBaseSchema: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const extend: (parent: any, properties: any) => {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const signedSchema: (schema: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
}) => {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const strictSchema: (schema: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
}) => {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const transfer: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const secondSignature: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const delegateRegistration: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const vote: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const multiSignature: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const multiSignatureLegacy: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const ipfs: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const htlcLock: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const htlcClaim: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const htlcRefund: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const multiPayment: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare const delegateResignation: {
    $id: any;
    type: string;
    if: {
        properties: {
            version: {
                anyOf: ({
                    type: string;
                    const?: undefined;
                } | {
                    const: number;
                    type?: undefined;
                })[];
            };
        };
    };
    then: {
        required: string[];
    };
    else: {
        required: string[];
    };
    properties: {
        id: {
            anyOf: ({
                $ref: string;
                type?: undefined;
            } | {
                type: string;
                $ref?: undefined;
            })[];
        };
        version: {
            enum: number[];
        };
        network: {
            $ref: string;
        };
        timestamp: {
            type: string;
            minimum: number;
        };
        nonce: {
            bignumber: {
                minimum: number;
            };
        };
        typeGroup: {
            type: string;
            minimum: number;
        };
        amount: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        fee: {
            bignumber: {
                minimum: number;
                bypassGenesis: boolean;
            };
        };
        senderPublicKey: {
            $ref: string;
        };
        signature: {
            $ref: string;
        };
        secondSignature: {
            $ref: string;
        };
        signSignature: {
            $ref: string;
        };
        signatures: {
            type: string;
            minItems: number;
            maxItems: number;
            additionalItems: boolean;
            uniqueItems: boolean;
            items: {
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
        };
    };
};
export declare type TransactionSchema = typeof transactionBaseSchema;
