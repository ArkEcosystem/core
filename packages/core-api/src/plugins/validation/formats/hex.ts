export function registerHexFormat(ajv) {
    ajv.addFormat("hex", {
        type: "string",
        validate: value => {
            try {
                Buffer.from(value, "hex");

                return true;
            } catch (e) {
                return false;
            }
        },
    });
}
