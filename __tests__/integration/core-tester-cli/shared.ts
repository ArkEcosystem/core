import { bignumify, httpie } from "@arkecosystem/core-utils";

const defaultOpts = ["--skipProbing"];

export const toFlags = (opts: object): string[] => {
    return Object.keys(opts)
        .map(k => [`--${k}`, String(opts[k])])
        .reduce((a, b) => a.concat(b), defaultOpts);
};

export const arkToSatoshi = value =>
    bignumify(value)
        .times(1e8)
        .toFixed();

export const expectTransactions = (transactions, obj) =>
    expect(transactions).toEqual(expect.arrayContaining([expect.objectContaining(obj)]));

export const captureTransactions = (nock, expectedTransactions) => {
    nock("http://localhost:4003")
        .post("/api/v2/transactions")
        .thrice()
        .reply(200, { data: {} });

    // @ts-ignore
    jest.spyOn(httpie, "post").mockImplementation((url, { body }) => {
        for (const transaction of body.transactions) {
            expectedTransactions.push(transaction);
        }
    });
};
