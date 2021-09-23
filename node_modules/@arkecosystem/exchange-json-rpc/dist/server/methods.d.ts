import { Interfaces } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
export declare const methods: ({
    name: string;
    method(params: {
        id: string;
    }): Promise<any>;
    schema: {
        type: string;
        properties: {
            id: {
                blockId: {};
                $ref?: undefined;
            };
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(): Promise<any>;
    schema?: undefined;
} | {
    name: string;
    method(params: {
        id: string;
        offset?: number;
    }): Promise<Boom.Boom<unknown> | {
        count: any;
        data: any;
    }>;
    schema: {
        type: string;
        properties: {
            id: {
                blockId: {};
                $ref?: undefined;
            };
            offset: {
                type: string;
            };
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        recipientId: string;
        amount: string;
        passphrase: string;
        vendorField?: string;
        fee?: string;
    }): Promise<Interfaces.ITransactionData | Boom.Boom<unknown>>;
    schema: {
        type: string;
        properties: {
            amount: {
                type: string;
            };
            recipientId: {
                type: string;
                $ref: string;
            };
            passphrase: {
                type: string;
            };
            vendorField: {
                type: string;
            };
            fee: {
                type: string;
            };
            id?: undefined;
            offset?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        username: string;
        passphrase: string;
        fee?: string;
    }): Promise<Interfaces.ITransactionData | Boom.Boom<unknown>>;
    schema: {
        type: string;
        properties: {
            username: {
                type: string;
            };
            passphrase: {
                type: string;
            };
            fee: {
                type: string;
            };
            id?: undefined;
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            vendorField?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        publicKey: string;
        passphrase: string;
        fee?: string;
    }): Promise<Interfaces.ITransactionData | Boom.Boom<unknown>>;
    schema: {
        type: string;
        properties: {
            publicKey: {
                type: string;
            };
            passphrase: {
                type: string;
            };
            fee: {
                type: string;
            };
            id?: undefined;
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            vendorField?: undefined;
            username?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        id: string;
    }): Promise<any>;
    schema: {
        type: string;
        properties: {
            id: {
                $ref: string;
                blockId?: undefined;
            };
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        userId: string;
        bip38: string;
        recipientId: string;
        amount: string;
        vendorField?: string;
        fee?: string;
    }): Promise<Interfaces.ITransactionData | Boom.Boom<unknown>>;
    schema: {
        type: string;
        properties: {
            amount: {
                type: string;
            };
            recipientId: {
                type: string;
                $ref: string;
            };
            vendorField: {
                type: string;
            };
            fee: {
                type: string;
            };
            bip38: {
                type: string;
            };
            userId: {
                type: string;
                $ref: string;
            };
            id?: undefined;
            offset?: undefined;
            passphrase?: undefined;
            username?: undefined;
            publicKey?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        passphrase: string;
    }): Promise<{
        publicKey: string;
        address: string;
    }>;
    schema: {
        type: string;
        properties: {
            passphrase: {
                type: string;
            };
            id?: undefined;
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
            address?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        address: string;
    }): Promise<any>;
    schema: {
        type: string;
        properties: {
            address: {
                type: string;
                $ref: string;
            };
            id?: undefined;
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        offset?: number;
        address: string;
    }): Promise<Boom.Boom<unknown> | {
        count: any;
        data: any;
    }>;
    schema: {
        type: string;
        properties: {
            address: {
                type: string;
                $ref: string;
            };
            offset: {
                type: string;
            };
            id?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            bip38?: undefined;
            userId?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    method(params: {
        userId: string;
        bip38: string;
    }): Promise<Boom.Boom<unknown> | {
        publicKey: string;
        address: string;
        wif: string;
    }>;
    schema: {
        type: string;
        properties: {
            bip38: {
                type: string;
            };
            userId: {
                type: string;
                $ref: string;
            };
            id?: undefined;
            offset?: undefined;
            amount?: undefined;
            recipientId?: undefined;
            passphrase?: undefined;
            vendorField?: undefined;
            fee?: undefined;
            username?: undefined;
            publicKey?: undefined;
            address?: undefined;
        };
        required: string[];
    };
})[];
