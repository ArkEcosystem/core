import { flags } from "@oclif/command";

export const satoshiFlag = flags.build({
    parse: input => {
        const value = Number(input);

        if (value < 1 / 1e8) {
            throw new Error(`Expected number greater than 1 satoshi.`);
        }

        return value;
    },
});
