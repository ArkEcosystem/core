import * as path from 'path';
import * as subProcess from './sub-process';

import { legacyPlugin as api } from '@snyk/cli-interface';
import { ManifestFiles, DependencyUpdates } from './types';
import { getMetaData, getDependencies } from './inspect-implementation';
import { applyUpgrades } from './apply-remediation-implementation';

export interface PythonInspectOptions {
  command?: string; // `python` command override
  allowMissing?: boolean; // Allow skipping packages that are not found in the environment.
  args?: string[];
}

type Options = api.SingleSubprojectInspectOptions & PythonInspectOptions;

// Given a path to a manifest file and assuming that all the packages (transitively required by the
// manifest) were installed (e.g. using `pip install`), produce a tree of dependencies.
export async function inspect(
  root: string,
  targetFile: string,
  options?: Options
): Promise<api.SinglePackageResult> {
  if (!options) {
    options = {};
  }
  let command = options.command || 'python';
  const includeDevDeps = !!(options.dev || false);
  let baseargs: string[] = [];

  if (path.basename(targetFile) === 'Pipfile') {
    // Check that pipenv is available by running it.
    const pipenvCheckProc = subProcess.executeSync('pipenv', ['--version']);
    if (pipenvCheckProc.status !== 0) {
      throw new Error(
        'Failed to run `pipenv`; please make sure it is installed.'
      );
    }
    command = 'pipenv';
    baseargs = ['run', 'python'];
  }

  const [plugin, pkg] = await Promise.all([
    getMetaData(command, baseargs, root, targetFile),
    getDependencies(
      command,
      baseargs,
      root,
      targetFile,
      options.allowMissing || false,
      includeDevDeps,
      options.args
    ),
  ]);
  return { plugin, package: pkg };
}

// Given contents of manifest file(s) and a set of upgrades, and assuming that all the packages
// were installed (e.g. using `pip install`), produce the updated manifests by detecting the
// provenance of top-level packages and replacing their specifications and adding "pinned" packages
// to the manifest.
// Currently only supported for `requirements.txt` - at least one file named `**/requirements.txt`
// must be in the manifests.
export async function applyRemediationToManifests(
  root: string,
  manifests: ManifestFiles,
  upgrades: DependencyUpdates,
  options: Options
) {
  const manifestNames = Object.keys(manifests);
  const targetFile = manifestNames.find(
    (fn) => path.basename(fn) === 'requirements.txt'
  );
  if (
    !targetFile ||
    !manifestNames.every(
      (fn) =>
        path.basename(fn) === 'requirements.txt' ||
        path.basename(fn) === 'constraints.txt'
    )
  ) {
    throw new Error(
      'Remediation only supported for requirements.txt and constraints.txt files'
    );
  }

  // Calculate provenance via Python code.
  // This currently requires costly setup of a virtual environment, when
  // called from pip-deps.
  // Alternative approaches to consider:
  // - modify python code to not require installed packages in this case
  // - replicate the parser of requirements.txt in JS code (in pip-deps?)
  const provOptions = { ...options };
  provOptions.args = provOptions.args || [];
  provOptions.args.push('--only-provenance');
  const topLevelDeps = (await inspect(root, targetFile, provOptions)).package;

  applyUpgrades(manifests, upgrades, topLevelDeps);

  return manifests;
}
