import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

export {};

declare global {
    namespace jest {
        // @ts-ignore - All declarations of 'Matchers' must have identical type parameters.
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            entityRegistered(): Promise<R>;
            entityResigned(): Promise<R>;
            entityUpdated(): Promise<R>;
        }
    }
}

expect.extend({
    entityRegistered: async (transaction: Interfaces.ITransactionData) => {
        let pass = false;

        let errors;
        try {
            const { body } = await got.get(`http://localhost:4003/api/entities/${transaction.id}`);

            const parsedBody = JSON.parse(body);

            errors = parsedBody.errors;

            const entityAsset: IEntityAsset = transaction.asset as IEntityAsset;
            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.id === transaction.id &&
                parsedBody.data.type === entityAsset.type &&
                parsedBody.data.subType === entityAsset.subType &&
                parsedBody.data.data.name === entityAsset.data.name &&
                parsedBody.data.data.ipfsData === entityAsset.data.ipfsData;
        } catch (e) {
            errors = e;
        }

        return {
            pass,
            // @ts-ignore
            message: /* istanbul ignore next */ () =>
                `expected entity ${transaction.id} ${this.isNot ? "not" : ""} to be registered. ${errors}`,
        };
    },

    entityResigned: async (registrationId: string) => {
        let pass = false;

        let errors;
        try {
            const { body } = await got.get(`http://localhost:4003/api/entities/${registrationId}`);

            const parsedBody = JSON.parse(body);

            errors = parsedBody.errors;

            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.id === registrationId &&
                parsedBody.data.isResigned === true;
        } catch (e) {
            errors = e;
        }

        return {
            pass,
            // @ts-ignore
            message: /* istanbul ignore next */ () =>
                `expected entity ${registrationId} ${this.isNot ? "not" : ""} to be resigned. ${errors}`,
        };
    },

    entityUpdated: async (updateTransaction: Interfaces.ITransactionData) => {
        let pass = false;

        let errors;
        try {
            const entityAsset: IEntityAsset = updateTransaction.asset as IEntityAsset;

            const { body } = await got.get(`http://localhost:4003/api/entities/${entityAsset.registrationId}`);

            const parsedBody = JSON.parse(body);

            errors = parsedBody.errors;

            pass =
                parsedBody.errors === undefined &&
                parsedBody.data.id === entityAsset.registrationId &&
                parsedBody.data.type === entityAsset.type &&
                parsedBody.data.subType === entityAsset.subType &&
                parsedBody.data.data.ipfsData === entityAsset.data.ipfsData;
        } catch (e) {
            errors = e;
        }

        return {
            pass,
            // @ts-ignore
            message: /* istanbul ignore next */ () =>
                `expected entity ${updateTransaction.id} ${this.isNot ? "not" : ""} to be updated. ${errors}`,
        };
    },
});
