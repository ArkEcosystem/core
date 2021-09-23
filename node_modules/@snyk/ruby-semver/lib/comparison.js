'use strict';

const GemVersion = require('./ruby/gem-version');

module.exports = {
  gt,
  gte,
  lt,
  lte,
  eq,
  neq,
  cmp,
  compare,
  rcompare,
  diff,
};

function gt(v1, v2) {
  return compare(v1, v2) > 0;
}

function gte(v1, v2) {
  return compare(v1, v2) >= 0;
}

function lt(v1, v2) {
  return compare(v1, v2) < 0;
}

function lte(v1, v2) {
  return compare(v1, v2) <= 0;
}

function eq(v1, v2) {
  return compare(v1, v2) === 0;
}

function neq(v1, v2) {
  return !eq(v1, v2);
}

function _strictEq(v1, v2) {
  return GemVersion.create(v1).isIdentical(GemVersion.create(v2));
}

function _strictNeq(v1, v2) {
  return !_strictEq(v1, v2);
}

function cmp(v1, comparator, v2) {
  switch (comparator) {
    case '>':
      return gt(v1, v2);
    case '>=':
      return gte(v1, v2);
    case '<':
      return lt(v1, v2);
    case '<=':
      return lte(v1, v2);
    case '==':
      return eq(v1, v2);
    case '!=':
      return neq(v1, v2);
    case '===':
      return _strictEq(v1, v2);
    case '!==':
      return _strictNeq(v1, v2);
    default:
      throw new Error(`Invalid comparator: ${comparator}`);
  }
}

function compare(v1, v2) {
  return GemVersion.create(v1).compare(GemVersion.create(v2));
}

function rcompare(v1, v2) {
  return GemVersion.create(v2).compare(GemVersion.create(v1));
}

function diff(v1, v2) {
  if (eq(v1, v2)) { return null; }

  const version1 = GemVersion.create(v1);
  const version2 = GemVersion.create(v2);
  let hasPrerelease;

  const segments = [version1.getSegments(), version2.getSegments()]
  .map(seg => {
    const prereleaseIndex = seg.findIndex(v => String(v).match(/[a-zA-Z]/));
    if (prereleaseIndex === -1) { return seg; }

    hasPrerelease = true;
    return seg.slice(0, prereleaseIndex);
  })
  .sort((a,b) => b.length - a.length)

  const diffPosition = segments[0].findIndex((v, i) => v !== segments[1][i]);

  if (diffPosition === -1 && hasPrerelease) {
    return 'prerelease';
  }

  const diffType = ['major', 'minor'][diffPosition] || 'patch';
  return (hasPrerelease ? 'pre' : '') + diffType;
}
