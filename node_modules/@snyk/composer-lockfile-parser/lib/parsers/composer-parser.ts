import * as _ from 'lodash';

import {
  DepTree,
  SystemPackages,
  PackageRefCount,
  LockFilePackage,
  ComposerJsonFile,
  ComposerDependencies,
} from '../types';

export class ComposerParser {
  // After this threshold, a package node in the dep tree won't have expanded dependencies.
  // This is a cheap protection against combinatorial explosion when there's N packages
  // that depend on each other (producing N! branches of the dep tree).
  // The value of 150 was chosen as a lowest one that doesn't break existing tests.
  // Switching to dependency graph would render this trick obsolete.
  private static MAX_PACKAGE_REPEATS: number = 150;

  public static getVersion(depObj: ComposerJsonFile | LockFilePackage): string {
    // check for `version` property. may not exist
    const versionFound: string = _.get(depObj, 'version', '');
    // even if found, may be an alias, so check
    const availableAliases = _.get(depObj, "extra['branch-alias']", []);
    // if the version matches the alias (either as is, or without 'dev-'), use the aliases version.
    // otherwise, use the version as is, and if not, the first found alias
    return _.get(availableAliases, versionFound) ||
      _.get(_.invert(availableAliases), versionFound.replace('dev-', '')) &&
      versionFound.replace('dev-', '') ||
      versionFound ||
      _.findKey(_.invert(availableAliases), '0'); // first available alias
  }

  public static buildDependencies(
    composerJsonObj: ComposerJsonFile,
    composerLockObjPackages: LockFilePackage[],
    depObj: ComposerJsonFile | LockFilePackage,
    depRecursiveArray: string[],
    systemVersions: SystemPackages,
    packageReferencesCount: PackageRefCount = {}): DepTree | {} {
    const requires: ComposerDependencies | undefined = _.get(depObj, 'require', undefined);
    if (!requires) {
      return {};
    }

    const result = {};

    for (const depName of Object.keys(requires)) {
      let depFoundVersion;
      // lets find if this dependency has an object in composer.lock
      const applicationData = composerLockObjPackages.find((composerPackage) => {
        return composerPackage.name === depName;
      });

      if (applicationData) {
        depFoundVersion = this.getVersion(applicationData);
      } else {
        // here we use the version from the requires - not a locked version
        const composerJsonRequires = _.get(composerJsonObj, 'require');
        depFoundVersion = _.get(systemVersions, depName) ||
          _.get(composerJsonRequires, depName) ||
          _.get(requires, depName);
      }

      depFoundVersion = depFoundVersion.replace(/^v(\d)/, '$1');

      result[depName] = {
        name: depName,
        version: depFoundVersion,
        dependencies: {},
      };

      let refCount = packageReferencesCount[depName] || 0;
      packageReferencesCount[depName] = ++refCount;

      if (!this.alreadyAddedDep(depRecursiveArray, depName) && refCount < this.MAX_PACKAGE_REPEATS) {
        depRecursiveArray.push(depName);
        result[depName].dependencies =
          ComposerParser.buildDependencies(composerJsonObj,
            composerLockObjPackages,
            _.find(composerLockObjPackages, {name: depName})!,
            depRecursiveArray,
            systemVersions,
            packageReferencesCount);
        depRecursiveArray.pop();
      }
    }

    return result;
  }

  private static alreadyAddedDep(arrayOfFroms, packageName): boolean {
    return arrayOfFroms.indexOf(packageName) > -1;
  }
}
