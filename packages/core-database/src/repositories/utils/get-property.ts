export const getProperty = (item: any, prop: string): any => {
    for (const [key, value] of Object.entries(item)) {
        if (key === prop) {
            return value;
        }

        if (value && value.constructor.name === "Object") {
            const result = getProperty(value, prop);
            if (result !== undefined) {
                return result;
            }
        }
    }

    return undefined;
};
