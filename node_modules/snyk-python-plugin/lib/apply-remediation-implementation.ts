import * as path from 'path';

import { ManifestFiles, DependencyUpdates } from './types';
import { legacyCommon } from '@snyk/cli-interface';

export function applyUpgrades(
  manifests: ManifestFiles,
  upgrades: DependencyUpdates,
  topLevelDeps: legacyCommon.DepTree
) {
  const requirementsFileName = Object.keys(manifests).find(
    (fn) => path.basename(fn) === 'requirements.txt'
  ) as string;
  const constraintsFileName = Object.keys(manifests).find(
    (fn) => path.basename(fn) === 'constraints.txt'
  );

  // Updates to requirements.txt
  const patch: { [zeroBasedIndex: number]: string | false } = {}; // false means remove the line
  const append: string[] = [];

  const originalRequirementsLines = manifests[requirementsFileName].split('\n');

  const extraMarkers = /--| \[|;/;

  for (const upgradeFrom of Object.keys(upgrades)) {
    const pkgName = upgradeFrom.split('@')[0].toLowerCase();
    const newVersion = upgrades[upgradeFrom].upgradeTo.split('@')[1];
    const topLevelDep = (topLevelDeps.dependencies || {})[
      pkgName
    ] as legacyCommon.DepTreeDep;
    if (topLevelDep && topLevelDep.labels && topLevelDep.labels.provenance) {
      // Top level dependency, to be updated in a manifest

      const lineNumbers = topLevelDep.labels.provenance
        .split(':')[1]
        .split('-')
        .map((x) => parseInt(x));
      // TODO(kyegupov): what if the original version spec was range, e.g. >=1.0,<2.0 ?
      // TODO(kyegupov): prevent downgrades
      const firstLineNo = lineNumbers[0] - 1;
      const lastLineNo =
        lineNumbers.length > 1 ? lineNumbers[1] - 1 : lineNumbers[0] - 1;
      const originalRequirementString = originalRequirementsLines
        .slice(firstLineNo, lastLineNo + 1)
        .join('\n')
        .replace(/\\\n/g, '');
      const firstExtraMarkerPos = originalRequirementString.search(
        extraMarkers
      );
      if (firstExtraMarkerPos > -1) {
        // maybe we should reinstate linebreaks here?
        patch[lineNumbers[0] - 1] =
          pkgName +
          '==' +
          newVersion +
          ' ' +
          originalRequirementString.slice(firstExtraMarkerPos).trim();
      } else {
        patch[lineNumbers[0] - 1] = pkgName + '==' + newVersion;
      }
      if (lastLineNo > firstLineNo) {
        for (let i = firstLineNo + 1; i <= lastLineNo; i++) {
          patch[i - 1] = false;
        }
      }
    } else {
      // The dependency is not a top level: we are pinning a transitive using constraints file.
      if (!constraintsFileName) {
        append.push(
          pkgName +
            '>=' +
            newVersion +
            ' # not directly required, pinned by Snyk to avoid a vulnerability'
        );
      } else {
        // TODO(kyegupov): parse constraints and replace the pre-existing one if any
        const lines = manifests[constraintsFileName].trim().split('\n');
        lines.push(
          pkgName +
            '>=' +
            newVersion +
            ' # pinned by Snyk to avoid a vulnerability'
        );
        manifests[constraintsFileName] = lines.join('\n') + '\n';
      }
    }
  }
  const lines: string[] = [];
  originalRequirementsLines.forEach((line, i) => {
    if (patch[i] === false) {
      return;
    }
    if (patch[i]) {
      lines.push(patch[i] as string);
    } else {
      lines.push(line);
    }
  });
  // Drop extra trailing newlines
  while (lines.length > 0 && !lines[lines.length - 1]) {
    lines.pop();
  }
  manifests[requirementsFileName] = lines.concat(append).join('\n') + '\n';
}
