export const update = {
    type: "object",
    additionalProperties: false,
    properties: {
        description: {
            allOf: [
                { type: "string", pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$" },
                { minLength: 1, maxLength: 140 },
            ]
        },
        website: { type: "string", format: "uri" },
        images: {
            type: "array",
            items: { type: "string", format: "uri", pattern: "https:\/\/flickr.com\/.*" },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
        },
        videos: {
            type: "array",
            items: { type: "string", format: "uri", pattern: "(https:\/\/youtube.com\/.*)|(https:\/\/vimeo.com\/.*)" },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
        },
        sourceControl: {
            type: "object",
            additionalProperties: false,
            properties: {
                github: { type: "string", format: "uri", pattern: "https:\/\/github.com\/.*" },
                gitlab: { type: "string", format: "uri", pattern: "https:\/\/gitlab.com\/.*" },
                bitbucket: { type: "string", format: "uri", pattern: "https:\/\/bitbucket.org\/.*" },
                npmjs: { type: "string", format: "uri", pattern: "https:\/\/npmjs.com\/.*" },
            }
        },
        socialMedia: {
            type: "object",
            additionalProperties: false,
            properties: {
                facebook: { type: "string", format: "uri", pattern: "https:\/\/facebook.com\/.*" },
                twitter: { type: "string", format: "uri", pattern: "https:\/\/twitter.com\/.*" },
                linkedin: { type: "string", format: "uri", pattern: "https:\/\/linkedin.com\/.*" },
            }
        }
    }
};

export const register = {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
        name: { $ref: "genericName", },
        ...update.properties,
    }
}

export const resign = {
    type: "object",
    additionalProperties: false,
    maxProperties: 0,
}