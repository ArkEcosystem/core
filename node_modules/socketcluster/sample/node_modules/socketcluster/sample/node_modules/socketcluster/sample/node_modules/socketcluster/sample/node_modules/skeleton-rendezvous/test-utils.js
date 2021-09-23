module.exports = {
  generateStringList: generateStringList,
  findKeySites: findKeySites,
  getDiffStats: getDiffStats,
  log: log
};

function generateStringList(baseString, count) {
  var items = [];
  for (var i = 0; i < count; i++) {
    items.push(baseString + i);
  }
  return items;
}

function getDistributionStats(countMap) {
  var minKeys = Infinity;
  var maxKeys = -Infinity;
  var diff;

  Object.keys(countMap).forEach((site) => {
    if (countMap[site] < minKeys) {
      minKeys = countMap[site];
    }
    if (countMap[site] > maxKeys) {
      maxKeys = countMap[site];
    }
  });
  diff = maxKeys / minKeys;

  return {
    min: minKeys,
    max: maxKeys,
    diff: diff
  };
}

function findKeySites(srh, keys) {
  var hashCount = 0;
  var realHashFn = srh.hash;

  srh.hash = function () {
    hashCount++;
    return realHashFn.apply(this, arguments);
  };

  var siteMap = {};
  var results = [];

  var start = Date.now();
  keys.forEach((key) => {
    var targetSite = srh.findSite(key);

    results.push(targetSite);
    if (!siteMap[targetSite]) {
      siteMap[targetSite] = [];
    }
    siteMap[targetSite].push(key);
  });
  var end = Date.now();

  var siteCountMap = {};
  srh.getSites().forEach((site) => {
    if (siteMap[site]) {
      siteCountMap[site] = siteMap[site].length;
    } else {
      siteCountMap[site] = 0;
    }
  });

  var stats = getDistributionStats(siteCountMap);
  stats.startTime = start;
  stats.endTime = end;
  stats.duration = end - start;

  return {
    map: siteMap,
    list: results,
    countMap: siteCountMap,
    hashCount: hashCount,
    stats: stats
  };
}

function getDiffStats(resultA, resultB) {
  var siteMapA = resultA.map;
  var siteMapB = resultB.map;

  var keyToSiteMapA = {};
  Object.keys(siteMapA).forEach((site) => {
    var keyList = siteMapA[site] || [];
    keyList.forEach((key) => {
      keyToSiteMapA[key] = site;
    });
  });

  var keyToSiteMapB = {};
  Object.keys(siteMapB).forEach((site) => {
    var keyList = siteMapB[site] || [];
    keyList.forEach((key) => {
      keyToSiteMapB[key] = site;
    });
  });

  var keyLookup = {};
  var diffKeyLookup = {};

  Object.keys(keyToSiteMapA).forEach((key) => {
    var siteA = keyToSiteMapA[key];
    var siteB = keyToSiteMapB[key];
    if (siteA !== siteB) {
      diffKeyLookup[key] = true;
    }
    keyLookup[key] = true;
  });

  Object.keys(keyToSiteMapB).forEach((key) => {
    var siteA = keyToSiteMapA[key];
    var siteB = keyToSiteMapB[key];
    if (siteA !== siteB) {
      diffKeyLookup[key] = true;
    }
    keyLookup[key] = true;
  });

  return {
    keyList: Object.keys(keyLookup),
    diffKeyList: Object.keys(diffKeyLookup)
  };
}

function log() {
  console.log('        \u001b[2m' + Array.prototype.join.call(arguments, ' ') + '\u001b[22m');
}
