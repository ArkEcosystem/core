export declare const seedNodesSchema: {
    type: string;
    minItems: number;
    maxItems: number;
    uniqueItems: boolean;
    items: {
        type: string;
        format: string;
    };
};
export declare const portsSchema: {
    type: string;
    maxProperties: number;
    minProperties: number;
    required: string[];
    additionalProperties: boolean;
    patternProperties: {
        "^.{1,214}$": {
            type: string;
            minimum: number;
            maximum: number;
        };
    };
};
