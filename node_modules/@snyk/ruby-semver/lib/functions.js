const GemVersion = require('./ruby/gem-version');

module.exports = {
  valid,
  prerelease,
  major,
  minor,
  patch,
  inc: () => { throw new Error('Not implemented'); },
}

function valid(v) {
  if (!v) { return null; }

  try {
    return GemVersion.create(v).toString();
  } catch (err) {
    return null;
  }
}

function prerelease(v) {
  try {
    const version = GemVersion.create(v);
    if (version.isPrerelease()) {
      const segments = version.getSegments();
      const preStartIndex = segments.findIndex(s => /[a-zA-Z]/.test(s));
      return segments.slice(preStartIndex);
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
}

function _segmentAt(v, index) {
  try {
    const segment = GemVersion.create(v).getSegments()[index];
    return segment === undefined ? null : segment;
  } catch(err) {
    return null;
  }
}

function major(v) {
  return _segmentAt(v, 0);
}

function minor(v) {
  return _segmentAt(v, 1);
}

function patch(v) {
  return _segmentAt(v, 2);
}
