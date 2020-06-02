export const update = {
    type: "object",
    additionalProperties: false,
    properties: {
        description: {
            type: "string",
            pattern: "^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$",
            minLength: 1,
            maxLength: 250,
        },
        website: { type: "string", format: "uri", minLength: 1, maxLength: 250 },
        images: {
            type: "array",
            items: { type: "string", format: "uri", pattern: "https:\/\/flickr.com\/.*", minLength: 1, maxLength: 250 },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
        },
        videos: {
            type: "array",
            items: {
                type: "string",
                format: "uri",
                pattern: "(https:\/\/youtube.com\/.*)|(https:\/\/vimeo.com\/.*)",
                minLength: 1,
                maxLength: 250,
            },
            minItems: 1,
            maxItems: 10,
            uniqueItems: true,
        },
        sourceControl: {
            type: "object",
            additionalProperties: false,
            properties: {
                github: { type: "string", format: "uri", pattern: "https:\/\/github.com\/.*", minLength: 1, maxLength: 250 },
                gitlab: { type: "string", format: "uri", pattern: "https:\/\/gitlab.com\/.*", minLength: 1, maxLength: 250 },
                bitbucket: { type: "string", format: "uri", pattern: "https:\/\/bitbucket.org\/.*", minLength: 1, maxLength: 250 },
                npmjs: { type: "string", format: "uri", pattern: "https:\/\/npmjs.com\/.*", minLength: 1, maxLength: 250 },
            }
        },
        socialMedia: {
            type: "object",
            additionalProperties: false,
            properties: {
                facebook: { type: "string", format: "uri", pattern: "https:\/\/facebook.com\/.*", minLength: 1, maxLength: 250 },
                twitter: { type: "string", format: "uri", pattern: "https:\/\/twitter.com\/.*", minLength: 1, maxLength: 250 },
                linkedin: { type: "string", format: "uri", pattern: "https:\/\/linkedin.com\/.*", minLength: 1, maxLength: 250 },
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