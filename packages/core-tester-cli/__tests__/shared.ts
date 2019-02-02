const defaultOpts = ["--skipTesting", "--skipValidation"];

export const toFlags = (opts: object): string[] => {
    return Object.keys(opts)
        .map(k => [`--${k}`, String(opts[k])])
        .reduce((a, b) => a.concat(b), defaultOpts);
};
