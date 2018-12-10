export function registerPublicKeyFormat(ajv) {
    ajv.addFormat("publicKey", {
        type: "string",
        validate: value => {
            try {
                return Buffer.from(value, "hex").length === 33;
            } catch (e) {
                return false;
            }
        },
    });
}
