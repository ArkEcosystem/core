import "@packages/core-test-framework/src/matchers/functional/entity";

import { EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";
import got from "got";
import _ from "lodash";

let entityTransaction;

beforeEach(() => {
    entityTransaction = {
        id: "dummy_id",
        asset: {
            type: EntityType.Business,
            subType: 0,
            data: {
                name: "dummy_name",
                ipfsData: "dummy_ipfs_data",
            },
        },
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("Entity", () => {
    describe("entityRegistered", () => {
        let spyOnPost;

        beforeAll(() => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        data: response,
                    }),
                };
            });
        });

        it("should pass", async () => {
            await expect(entityTransaction).entityRegistered();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if asset is different", async () => {
            const tmpEntityTransaction = _.cloneDeep(entityTransaction);
            tmpEntityTransaction.asset.subType = 1;

            await expect(tmpEntityTransaction).not.entityRegistered();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if error in response", async () => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: response,
                    }),
                };
            });

            await expect(entityTransaction).not.entityRegistered();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if method throws error", async () => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(entityTransaction).not.entityRegistered();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("entityResigned", () => {
        it("should pass", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    isResigned: true,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        data: response,
                    }),
                };
            });

            await expect(entityTransaction.id).entityResigned();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if is not resigned", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    isResigned: false,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        data: response,
                    }),
                };
            });

            await expect(entityTransaction.id).not.entityResigned();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if response contains errors", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    isResigned: true,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: response,
                    }),
                };
            });

            await expect(entityTransaction.id).not.entityResigned();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if method throws error", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(entityTransaction.id).not.entityResigned();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("entityUpdated", () => {
        let spyOnPost;

        beforeAll(() => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        data: response,
                    }),
                };
            });
        });

        it("should pass", async () => {
            const updateEntityTransaction = _.cloneDeep(entityTransaction);
            updateEntityTransaction.asset.registrationId = entityTransaction.id;

            await expect(updateEntityTransaction).entityUpdated();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should pass if asset is different", async () => {
            const updateEntityTransaction = _.cloneDeep(entityTransaction);
            updateEntityTransaction.asset.registrationId = entityTransaction.id;

            updateEntityTransaction.asset.subType = 1;

            await expect(updateEntityTransaction).not.entityUpdated();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if response contains errors", async () => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                const response = {
                    id: entityTransaction.id,
                    ...entityTransaction.asset,
                };

                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: response,
                    }),
                };
            });

            const updateEntityTransaction = _.cloneDeep(entityTransaction);
            updateEntityTransaction.asset.registrationId = entityTransaction.id;

            await expect(updateEntityTransaction).not.entityUpdated();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if method throws error", async () => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                throw new Error();
            });

            const updateEntityTransaction = _.cloneDeep(entityTransaction);
            updateEntityTransaction.asset.registrationId = entityTransaction.id;

            await expect(updateEntityTransaction).not.entityUpdated();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
