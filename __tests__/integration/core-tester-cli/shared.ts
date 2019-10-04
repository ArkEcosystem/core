import { httpie } from "@arkecosystem/core-utils";
import { Utils } from "@arkecosystem/crypto";

const defaultOpts = ["--skipProbing"];

export const toFlags = (opts: object): string[] => {
    return Object.keys(opts)
        .map(k => [`--${k}`, String(opts[k])])
        .reduce((a, b) => a.concat(b), defaultOpts);
};

export const arkToSatoshi = value => Utils.BigNumber.make(value * 1e8);

export const expectTransactions = (transactions, obj) =>
    expect(transactions).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));

export const captureTransactions = (nock, expectedTransactions) => {
    nock("http://localhost:4003")
        .post("/api/transactions")
        .thrice()
        .reply(200, { data: {} });

    // @ts-ignore
    jest.spyOn(httpie, "post").mockImplementation((url, { body }) => {
        for (const transaction of body.transactions) {
            expectedTransactions.push(transaction);
        }
    });
};
