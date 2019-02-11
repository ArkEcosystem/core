const between = (actual, expected) => actual > expected.min && actual < expected.max;
const contains = (actual, expected) => actual.includes(expected);
const eq = (actual, expected) => actual === expected;
const falsy = actual => actual === false;
const gt = (actual, expected) => actual > expected;
const gte = (actual, expected) => actual >= expected;
const lt = (actual, expected) => actual < expected;
const lte = (actual, expected) => actual <= expected;
const ne = (actual, expected) => actual !== expected;
const notBetween = (actual, expected) => !between(actual, expected);
const regexp = (actual, expected) => new RegExp(expected).test(actual);
const truthy = actual => actual === true;

export { between, contains, eq, falsy, gt, gte, lt, lte, ne, notBetween, regexp, truthy };
