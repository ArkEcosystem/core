import { DockerOptions } from "../docker";
import { Binary } from "./types";

export { analyze };

async function analyze(
  targetImage: string,
  installedPackages: string[],
  pkgManager?: string,
  options?: DockerOptions,
) {
  const binaries = await getBinaries(
    targetImage,
    installedPackages,
    pkgManager,
    options,
  );
  return {
    Image: targetImage,
    AnalyzeType: "binaries",
    Analysis: binaries,
  };
}

const binaryVersionExtractors = {
  node: require("./binary-version-extractors/node"),
  openjdk: require("./binary-version-extractors/openjdk-jre"),
};

async function getBinaries(
  targetImage: string,
  installedPackages: string[],
  pkgManager?: string,
  options?: DockerOptions,
): Promise<Binary[]> {
  const binaries: Binary[] = [];
  for (const versionExtractor of Object.keys(binaryVersionExtractors)) {
    const extractor = binaryVersionExtractors[versionExtractor];
    if (
      extractor.installedByPackageManager(
        installedPackages,
        pkgManager,
        options,
      )
    ) {
      continue;
    }
    const binary = await extractor.extract(targetImage, options);
    if (binary) {
      binaries.push(binary);
    }
  }
  return binaries;
}
