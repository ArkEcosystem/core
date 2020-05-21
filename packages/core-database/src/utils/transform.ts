import { BigNumber } from "@arkecosystem/utils";
import { FindOperator } from "typeorm";

export const transformBigInt = {
    from(value: string | undefined): BigNumber | undefined {
        if (value !== undefined) {
            return BigNumber.make(value);
        }

        return undefined;
    },
    to(value: BigNumber | FindOperator<any>): string | undefined {
        if (value !== undefined) {
            return value instanceof FindOperator ? value.value : value.toString();
        }

        return undefined;
    },
};

export const transformVendorField = {
    from: (value: Buffer | undefined | null): string | undefined => {
        if (value !== undefined && value !== null) {
            return value.toString("utf8");
        }

        return undefined;
    },
    to: (value: string | FindOperator<any> | undefined | null): Buffer | undefined => {
        if (value !== undefined && value !== null) {
            return Buffer.from(value instanceof FindOperator ? value.value : value, "utf8");
        }

        return undefined;
    },
};
