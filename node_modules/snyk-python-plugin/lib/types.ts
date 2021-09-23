export interface UpgradeRemediation {
  upgradeTo: string;
  // Other fields are of no interest
}

export interface DependencyUpdates {
  [from: string]: UpgradeRemediation;
}

export interface ManifestFiles {
  // Typically these are requirements.txt, constraints.txt and Pipfile;
  // the plugin supports paths with subdirectories
  [name: string]: string; // name-to-content
}
