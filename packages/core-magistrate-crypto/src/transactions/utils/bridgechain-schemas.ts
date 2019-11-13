export const seedNodesSchema = {
    type: "array",
    minItems: 1,
    maxItems: 10,
    uniqueItems: true,
    items: {
        type: "string",
        format: "peer",
    },
};

export const portsSchema = {
	type: "object",
	maxProperties: 32,
    minProperties: 1,
    additionalProperties: false,
    patternProperties: {
	    "^.{4,64}$": {
	        type: "integer",
	        minimum: 0,
	        maximum: 65535,
	    },
    },
};
