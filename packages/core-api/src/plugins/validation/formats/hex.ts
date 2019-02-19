export function registerHexFormat(ajv) {
    ajv.addFormat("hex", {
        type: "string",
        validate: value => value.match(/^[0-9a-f]+$/i) !== null && value.length % 2 === 0,
    });
}
