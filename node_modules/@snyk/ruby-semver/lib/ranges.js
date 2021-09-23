'use strict';

const GemVersion = require('./ruby/gem-version');
const GemRequirement = require('./ruby/gem-requirement');
const _comparison = require('./comparison');
const compare = _comparison.compare;
const rcompare = _comparison.rcompare;

module.exports = {
  validRange,
  satisfies,
  maxSatisfying,
  minSatisfying,
  gtr: () => { throw new Error('Not implemented'); },
  ltr: () => { throw new Error('Not implemented'); },
  outside: () => { throw new Error('Not implemented'); },
};

function _createRequirement(range) {
  return GemRequirement.create(range.split(','));
}

function _expandTildes(gemRequirement) {
  const requirements = [];
  gemRequirement.requirements.forEach((req) => {
    const op = req[0];
    const version = req[1];
    if (op.indexOf('~') !== -1) {
      requirements.push(`>= ${version}`);
      requirements.push(`< ${version.bump()}`);
    } else {
      requirements.push(`${op} ${version}`);
    }
  });
  return GemRequirement.create(requirements);
}

function validRange(range) {
  if (range === null || range === undefined) { return null; }
  if (range === '') { return GemRequirement.default().toString(); }

  try {
    let requirement = _createRequirement(range);
    if (range.indexOf('~') !== -1) {
      requirement = _expandTildes(requirement);
    }
    return requirement.toString();
  } catch (err) {
    return null;
  }
}

function satisfies(version, range) {
  try {
    return _createRequirement(range).satisfiedBy(
      GemVersion.create(version));
  } catch (err) {
    return false;
  }
}

function _firstSatisfying(versions, range, compareFunction) {
  const requirement = _createRequirement(range);
  const maxSatisfying = versions
    .map(v => GemVersion.create(v))
    .sort(compareFunction)
    .find(v => requirement.satisfiedBy(v));
  return maxSatisfying ? maxSatisfying.toString() : null;
}

function maxSatisfying(versions, range) {
  return _firstSatisfying(versions, range, rcompare);
}

function minSatisfying(versions, range) {
  return _firstSatisfying(versions, range, compare);
}
