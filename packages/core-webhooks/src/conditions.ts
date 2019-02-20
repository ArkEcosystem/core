export function between(actual, expected) {
    return actual > expected.min && actual < expected.max;
}

export function contains(actual, expected) {
    return actual.includes(expected);
}

export function eq(actual, expected) {
    return actual === expected;
}

export function falsy(actual) {
    return actual === false;
}

export function gt(actual, expected) {
    return actual > expected;
}

export function gte(actual, expected) {
    return actual >= expected;
}

export function lt(actual, expected) {
    return actual < expected;
}

export function lte(actual, expected) {
    return actual <= expected;
}

export function ne(actual, expected) {
    return actual !== expected;
}

export function notBetween(actual, expected) {
    return !between(actual, expected);
}

export function regexp(actual, expected) {
    return new RegExp(expected).test(actual);
}

export function truthy(actual) {
    return actual === true;
}
