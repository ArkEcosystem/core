import { bignumify } from "@arkecosystem/core-utils";
import axios from "axios";

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

export const captureTransactions = (mockAxios, expectedTransactions) => {
    mockAxios.onPost("http://localhost:4003/api/v2/transactions").reply(200, { data: {} });

    // @ts-ignore
    jest.spyOn(axios, "post").mockImplementation((uri, { transactions }) => {
        for (const transaction of transactions) {
            expectedTransactions.push(transaction);
        }
    });
};
