export const between = (actual, expected) => {
    return actual > expected.min && actual < expected.max;
};

export const contains = (actual, expected) => {
    return actual.includes(expected);
};

export const eq = (actual, expected) => {
    return actual === expected;
};

export const falsy = actual => {
    return actual === false;
};

export const gt = (actual, expected) => {
    return actual > expected;
};

export const gte = (actual, expected) => {
    return actual >= expected;
};

export const lt = (actual, expected) => {
    return actual < expected;
};

export const lte = (actual, expected) => {
    return actual <= expected;
};

export const ne = (actual, expected) => {
    return actual !== expected;
};

export const notBetween = (actual, expected) => {
    return !between(actual, expected);
};

export const regexp = (actual, expected) => {
    return new RegExp(expected).test(actual);
};

export const truthy = actual => {
    return actual === true;
};
