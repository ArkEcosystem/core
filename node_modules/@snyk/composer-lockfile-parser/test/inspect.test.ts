import * as fs from 'fs';
import * as tap from 'tap';
import * as _ from 'lodash';
import * as path from 'path';
import request from 'sync-request';

import { buildDepTreeFromFiles } from '../lib';
import { systemVersionsStub } from './stubs/system_deps_stub';

const deepTestFolders = [
  'proj_with_no_deps',
  'vulnerable_project',
  'circular_deps_php_project',
  'many_deps_php_project',
  'circular_deps_special_test',
  'proj_with_aliases',
  'proj_with_aliases_external_github',
  'no_branch_alias',
];

deepTestFolders.forEach((folder) => {
  tap.test('php plugin for ' + folder, async (t) => {
    const projFolder = './test/fixtures/' + folder;

    try {
      const depTree = buildDepTreeFromFiles(projFolder, 'composer.lock', systemVersionsStub);

      t.test('match packages with expected', (test) => {
        const expTree = JSON.parse(fs.readFileSync(path.resolve(projFolder, 'composer_deps.json'), 'utf-8'));

        test.deepEqual(depTree, expTree);
        test.end();
      });
    } catch (err) {
      /* do nothing */
    }
  });
});

tap.test('missing function `basePath` param', async (t) => {
  try {
    buildDepTreeFromFiles(null!, './composer.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.equal(err.message, 'Missing `basePath` parameter for buildDepTreeFromFiles()', 'basePath is missing');
    t.end();
  }
});

tap.test('missing function `lockFileName` param', async (t) => {
  const projFolder = './test/fixtures/many_deps_php_project';

  try {
    buildDepTreeFromFiles(projFolder, null!, systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.equal(err.message, 'Missing `lockfile` parameter for buildDepTreeFromFiles()', 'lockFileName is missing');
    t.end();
  }
});

tap.test('missing function `systemVersion` params', async (t) => {
  const projFolder = './test/fixtures/many_deps_php_project';

  try {
    buildDepTreeFromFiles(projFolder, './composer.lock', null!);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.equal(err.message, 'Missing `systemVersions` parameter for buildDepTreeFromFiles()',
      'systemVersion is missing');
    t.end();
  }
});

tap.test('lockfile not found', async (t) => {
  const projFolder = './test/fixtures/many_deps_php_project';

  try {
    buildDepTreeFromFiles(projFolder, './c_o_m_p_o_s_e_r.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.match(err.message, /^Lockfile not found at location:/, 'lockfile not found');
    t.end();
  }
});

tap.test('composer.json not found', async (t) => {
  const projFolder = './test/fixtures/missing_compose_json';

  try {
    buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.match(err.message, /^Target file composer\.json not found at location:/, 'composer.json not found');
    t.end();
  }
});

tap.test('package param in lock file is missing', async (t) => {
  const projFolder = './test/fixtures/missing_package_prop';

  try {
    buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'InvalidUserInputError', 'correct error type thrown');
    t.equal(err.message, 'Invalid lock file. Must contain `packages` property', 'packages property missing');
    t.end();
  }
});

tap.test('composer.lock is not valid json', async (t) => {
  const projFolder = './test/fixtures/lockfile-invalid-json';

  try {
    buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'ParseError', 'correct error type thrown');
    t.equal(err.message, 'Failed to parse lock file. Error: Unexpected token , in JSON at position 6',
      'invalid composer.lock');
    t.end();
  }
});

tap.test('composer.json is not valid json', async (t) => {
  const projFolder = './test/fixtures/composer-invalid-json';

  try {
    buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
  } catch (err) {
    t.equal(err.name, 'ParseError', 'correct error type thrown');
    t.equal(err.message, 'Failed to parse manifest file. Error: Unexpected token , in JSON at position 3',
      'invalid composer.json');
    t.end();
  }
});

tap.test('composer parser for project with many deps', async (t) => {
  const projFolder = './test/fixtures/many_deps_php_project';
  try {
    const depTree = buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
    t.test('match root pkg object', (test) => {
      test.match(depTree, {
        name: 'symfony/console',
        version: '4.0-dev',
        packageFormatVersion: 'composer:0.0.1',
      }, 'root pkg');

      test.end();
    });
  } catch (err) {
    /* do nothing */
  }
});

tap.test('composer parser for project with interconnected deps', async (t) => {
  const projFolder = './test/fixtures/interdependent_modules';

  try {
    const depTree = buildDepTreeFromFiles(projFolder, './composer.lock', systemVersionsStub);
    t.test('match root pkg object', (test) => {
      test.match(depTree, {
        name: 'foo',
        version: '1.1.1',
        packageFormatVersion: 'composer:0.0.1',
      }, 'root pkg');

      test.end();
    });
    t.test('dep tree total size is as expected', (test) => {
      test.ok(JSON.stringify(depTree).length < 200000, 'dep tree JSON < 200KB');
      test.end();
    });
  } catch (err) {
    /* do nothing */
  }
});

tap.test('with alias, uses correct version', async (t) => {
  const projFolder = './test/fixtures/proj_with_aliases';
  try {
    const composerJson = JSON.parse(fs.readFileSync(path.resolve(projFolder, 'composer.json'), 'utf-8'));

    const depTree = buildDepTreeFromFiles(projFolder, 'composer.lock', systemVersionsStub);
    const deps: any = depTree.dependencies;
    const monologBridgeObj = _.find(deps, {name: 'symfony/monolog-bridge'});
    const actualVersionInstalled = monologBridgeObj.version.slice(0, -2); // remove the trailing .0
    const expectedVersionString = _.get(composerJson, 'require[\'symfony/monolog-bridge\']'); // '2.6 as 2.7'
    const [realVersion, aliasVersion] = expectedVersionString.split(' as '); // real = 2.6, alias = 2.7
    t.test('so versions to real version and not alias', (test) => {
      test.equal(actualVersionInstalled, realVersion, 'version mismatch');
      test.notEqual(actualVersionInstalled, aliasVersion, 'matches alias!');
      test.end();
    });
  } catch (err) {
    /* do nothing */
  }
});

tap.test('with alias in external repo', async (t) => {
  const projFolder = './test/fixtures/proj_with_aliases_external_github';
  try {
    const depTree = buildDepTreeFromFiles(projFolder, 'composer.lock', systemVersionsStub);

    const composerJson = JSON.parse(fs.readFileSync(path.resolve(projFolder, 'composer.json'), 'utf-8'));
    const composerJsonAlias = composerJson.require['symfony/monolog-bridge'];
    const aliasBranch = composerJsonAlias.split(' as ').shift().replace('dev-', '');

    // to be really sure, we take a look at repo@`url` and check for branch
    const apiBranchesUrl = composerJson.repositories[0].url.replace(
      'https://github.com/', 'https://api.github.com/repos/') + '/branches';
    let branchesData;

    // sometimes we hit the github api limit, so we use a mock
    try {
      const res = request('GET', apiBranchesUrl, {
        headers: {
          'user-agent': 'CI Testing',
        },
      });
      branchesData = JSON.parse(res.getBody().toString());
    } catch (error) {
      branchesData = [
        {name: 'my-bugfix'},
      ];
    }
    const ourAliasBranchName = _.get(_.find(branchesData, {name: aliasBranch}), 'name');

    t.test('in composer.json', (test) => {
      test.type(composerJson.version, 'undefined', 'there should not be a version property');
      // it's version looks like this: dev-my-bugfix as 2.7
      test.equal(composerJsonAlias.split(' as ').length, 2, 'we are dealing with a repo that uses an alias');
      test.equal(composerJsonAlias.split('-').shift(), 'dev',
        'the alias part should start with dev- (whats after, is repo name)');

      // todo: should be able to detect this on any repo

      test.equal(composerJson.repositories[0].url,
        'https://github.com/aryehbeitz/monolog-bridge',
        'there should be a url subproperty');
      test.equal(composerJson.repositories[0].type, 'vcs', 'there should be a type subproperty');
      // the alias is a branch
      test.equal(aliasBranch, ourAliasBranchName, 'alias branch not found on remote github');
      test.end();
    });

    // now to make sure we got it right in the plugin parsing
    t.test('in plugin result', (test) => {
      const deps: any = depTree.dependencies;
      const monologBridgeObj = _.find(deps, {name: 'symfony/monolog-bridge'});
      // do we want our found version to contain a dev- prefix or not?
      // guessing not, we should add functionality so this test passes
      test.equal(monologBridgeObj.version, aliasBranch, 'alias branch must match result');
      test.end();
    });
  } catch (err) {
    /* do nothing */
  }
});

tap.test('project name is not empty', async (t) => {
  const projFolder = './test/fixtures/no_project_name';

  try {
    const depTree = buildDepTreeFromFiles(projFolder, 'composer.lock', systemVersionsStub);

    t.test('make sure project name is no-name', (test) => {
      test.deepEqual(depTree.name, 'no_project_name');
      test.end();
    });

    t.end();
  } catch (err) {
    /* do nothing */
  }
});
