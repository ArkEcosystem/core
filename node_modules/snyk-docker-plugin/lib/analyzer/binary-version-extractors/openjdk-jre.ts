import { Docker, DockerOptions } from "../../docker";
import { Binary } from "../types";

export { extract, installedByPackageManager };

async function extract(
  targetImage: string,
  options?: DockerOptions,
): Promise<Binary | null> {
  try {
    // https://stackoverflow.com/questions/
    // 13483443/why-does-java-version-go-to-stderr
    const output = await new Docker(targetImage, options).run("java", [
      "-version",
    ]);
    return parseOpenJDKBinary(output.stdout + output.stderr);
  } catch (error) {
    const stderr = error.stderr;
    if (typeof stderr === "string" && stderr.indexOf("not found") >= 0) {
      return null;
    }
    throw new Error(stderr);
  }
}

function parseOpenJDKBinary(fullVersionOutput: string) {
  /*
  `java -version` output:
  `java version "1.8.0_191"
   Java(TM) SE Runtime Environment (build 1.8.0_191-b12)
   Java HotSpot(TM) 64-Bit Server VM (build 25.191-b12, mixed mode)`
  => extracting `1.8.0_191-b12`
  */
  const runtimeEnv = "Runtime Environment";
  const runtimeLine =
    fullVersionOutput &&
    fullVersionOutput
      .trim()
      .split("\n")
      .find((line) => line.includes(runtimeEnv));
  if (!runtimeLine) {
    return null;
  }

  const bracketsRE = /\(build (.*)\)$/;
  const buildVersion = runtimeLine.match(bracketsRE);
  const version = buildVersion && buildVersion[1];
  if (!version) {
    return null;
  }
  return {
    name: "openjdk-jre",
    version,
  };
}

const javaPkgRegexByPkgManager = {
  apt: [
    /openjdk-\d*-jre-headless/,
    // openjdk-11-jre-headless
    /gcj-\d*.?\d*-jre-headless/,
    // gcj-4.8-jre-headless
    /gcc-snapshot/,
  ],
  apk: [/java-common/, /java-gcj-compat/, /^openjdk\d+/], // openjdk8-jre-base, openjdk7
  rpm: [
    /^java-\d*.?\d*.?\d*-openjdk/,
    // java-11-openjdk-11.0.ea.28-7.el7.x86_64,
    // java-1.8.0-openjdk-1.8.0.181-7.b13.el7.i686
    /^java-\d*.?\d*.?\d*-gcj/,
  ],
  // java-1.5.0-gcj-1.5.0.0-29.1.el6.x86_64
};

function installedByPackageManager(
  installedPackages: string[],
  pkgManager?: string,
): boolean {
  if (!pkgManager || !javaPkgRegexByPkgManager.hasOwnProperty(pkgManager)) {
    return false;
  }
  const binaryPkgNames = javaPkgRegexByPkgManager[pkgManager];
  for (const pkg of installedPackages) {
    for (const binaryRegex of binaryPkgNames) {
      if (pkg.match(binaryRegex)) {
        return true;
      }
    }
  }
  return false;
}
