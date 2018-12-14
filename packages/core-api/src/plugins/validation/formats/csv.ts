export function registerCsvFormat(ajv) {
    ajv.addFormat("csv", {
        type: "string",
        validate: value => {
            try {
                const a = value.split(",");

                return a.length > 0 && a.length <= 1000;
            } catch (e) {
                return false;
            }
        },
    });
}
