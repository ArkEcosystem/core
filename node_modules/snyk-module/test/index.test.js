var test = require('tap').test;
var mod = require('../');

test('module string to object', function (t) {
  t.deepEqual(mod('nodemon'), { name: 'nodemon', version: '*' }, 'supports versionless');
  t.deepEqual(mod('nodemon@latest'), { name: 'nodemon', version: '*' }, 'switches latest to *');
  t.deepEqual(mod('nodemon@'), { name: 'nodemon', version: '*' }, 'always give a version');
  t.deepEqual(mod('nodemon@1'), { name: 'nodemon', version: '1' }, 'with version');
  t.deepEqual(mod('nodemon@1.0'), { name: 'nodemon', version: '1.0' }, 'with version');
  t.deepEqual(mod('nodemon@1.0.0'), { name: 'nodemon', version: '1.0.0' }, 'with version');

  t.deepEqual(mod('@remy/snyk-module'), { name: '@remy/snyk-module', version: '*' }, 'private packages');
  t.deepEqual(mod('jsbin', 1), { name: 'jsbin', version: '1' }, 'version arg works');
  t.deepEqual(mod('@remy/jsbin', 1), { name: '@remy/jsbin', version: '1' }, 'scoped with version arg works');

  [
    'a@1',
    'url',
  ].forEach(function (str) {
    t.ok(mod(str), str + ' parsed ok');
  });

  var urls = [
    'https://github.com/remy/undefsafe',
    'https://github.com/remy/undefsafe/',
    'https://github.com/remy/undefsafe.git',
    'git@github.com:remy/undefsafe.git',
    'git@bitbucket.org:remy/undefsafe.git',
    'remy/undefsafe',
  ];

  urls = urls.reduce(function (acc, curr) {
    acc.push(curr);
    if (curr.indexOf('@') === -1) {
      acc.push('undefsafe@' + curr);
    }
    return acc;
  }, []);

  var expect = {
    name: 'undefsafe',
    version: 'remy/undefsafe',
  };

  urls.forEach(function (url) {
    t.deepEqual(mod(url), expect, url + ' works');
  });

  t.deepEqual(mod('jsbin/jsbin'), { name: 'jsbin', version: 'jsbin/jsbin' }, 'short github works');

  t.deepEqual(mod(urls[0] + '#123'), { name: 'undefsafe', version: 'remy/undefsafe#123'}, 'add hash correctly');

  t.throws(function () {
    mod();
  }, /requires string/, 'requires args');


  // pkg names
  t.deepEqual(
    mod('grunt-sails-linker@git://github.com/Zolmeister/grunt-sails-linker.git'),
    {
      name: 'grunt-sails-linker',
      version: 'Zolmeister/grunt-sails-linker'
    }, 'package + giturl as version works');

  // privately hosted git repo is supported
  t.deepEqual(mod('ikt@git+http://ikt.pm2.io/ikt.git#master'),
    { name: 'ikt', version: 'git+http://ikt.pm2.io/ikt.git#master' },
    'external git repo is supported');

  t.deepEqual(mod('ikt@git+ssh://git@ikt.pm2.io/ikt.git#master'),
    { name: 'ikt', version: 'git+ssh://git@ikt.pm2.io/ikt.git#master' },
    'external git repo with ssh is supported');

  t.deepEqual(mod('@scope/ikt@git+ssh://git@ikt.pm2.io/ikt.git#master'),
    { name: '@scope/ikt', version: 'git+ssh://git@ikt.pm2.io/ikt.git#master' },
    'scoped package with git repo is supported');

  t.end();
});

test('loose parsing', function (t) {
  var opts = { loose: true };

  t.deepEqual(
    mod('grunt-sails-linker@git://github.com/Zolmeister/grunt-sails-linker.git', opts),
    {
      name: 'grunt-sails-linker',
      version: 'Zolmeister/grunt-sails-linker'
    }, 'package + giturl as version works');

  // privately hosted git repo not supported
  t.deepEqual(mod('ikt@git+http://ikt.pm2.io/ikt.git#master', opts),
    { name: 'ikt', version: '*' }, 'loose allows non-supported parsing');

  t.end();
});

test('vanilla urls from github', function (t) {
  var urls = [
    'https://github.com/snyk/module/tree/v1.6.0',
    'https://github.com/snyk/module',
    'https://github.com/snyk/module/tree/master',
    'https://github.com/snyk/module/commit/fc0ac92416fe330cb9d13b6cdefa007de81885ad'
  ];

  var expect = [
    { name: 'module', version: 'snyk/module#v1.6.0' },
    { name: 'module', version: 'snyk/module' },
    { name: 'module', version: 'snyk/module#master' },
    { name: 'module', version: 'snyk/module#fc0ac92416fe330cb9d13b6cdefa007de81885ad' },
  ]

  urls.forEach(function (url, i) {
    t.deepEqual(mod(url), expect[i], url + ' works');
  });

  t.end();
});

test('encoding', function (t) {
  t.equal(mod.encode('snyk'), 'snyk', 'vanilla strings unaffected');
  t.equal(mod.encode('@snyk/config'), '@snyk%2Fconfig', 'slash is escaped');
  t.end();
});

test('Maven modules', function(t) {
  var groupId = 'org.apache.httpcomponents';
  var artifactId = 'httpcomponents-core';
  var packageName = groupId + ':' + artifactId;

  t.equal(mod.encode(packageName), groupId + '%3A' + artifactId);

  t.deepEqual(mod(packageName, {packageManager: 'maven'}),
    {name: packageName, version: '*'});

  t.deepEqual(mod(packageName, '3.4.5', {packageManager: 'maven'}),
    {name: packageName, version: '3.4.5'});

  t.deepEqual(mod(packageName, '3.4.5-SNAPSHOT', {packageManager: 'maven'}),
    {name: packageName, version: '3.4.5-SNAPSHOT'});

  t.deepEqual(mod(packageName + '@3.4.5', {packageManager: 'maven'}),
    {name: packageName, version: '3.4.5'});

  try {
    mod(groupId, {packageManager: 'maven'});
  } catch(e) {
    t.equal(e.message, 'invalid Maven package name: ' + groupId);
  }

  try {
    mod(packageName);
  } catch(e) {
    t.equal(e.message,
      'invalid package name: ' +
      groupId + ':' + artifactId +
      ', errors: name can only contain URL-friendly characters');
  }

  t.end();
});
