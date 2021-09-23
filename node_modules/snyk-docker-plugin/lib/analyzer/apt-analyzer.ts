import { Docker, DockerOptions } from "../docker";
import { AnalyzerPkg } from "./types";

export { analyze };

async function analyze(targetImage: string, options?: DockerOptions) {
  const docker = new Docker(targetImage, options);
  const dpkgFile = (await docker.catSafe("/var/lib/dpkg/status")).stdout;
  const pkgs = parseDpkgFile(dpkgFile);

  const extFile = (await docker.catSafe("/var/lib/apt/extended_states")).stdout;
  if (extFile) {
    setAutoInstalledPackages(extFile, pkgs);
  }

  return {
    Image: targetImage,
    AnalyzeType: "Apt",
    Analysis: pkgs,
  };
}

function parseDpkgFile(text: string) {
  const pkgs: AnalyzerPkg[] = [];
  let curPkg: any = null;
  for (const line of text.split("\n")) {
    curPkg = parseDpkgLine(line, curPkg, pkgs);
  }
  return pkgs;
}

function parseDpkgLine(text: string, curPkg: AnalyzerPkg, pkgs: AnalyzerPkg[]) {
  const [key, value] = text.split(": ");
  switch (key) {
    case "Package":
      curPkg = {
        Name: value,
        Version: undefined,
        Source: undefined,
        Provides: [],
        Deps: {},
        AutoInstalled: undefined,
      };
      pkgs.push(curPkg);
      break;
    case "Version":
      curPkg.Version = value;
      break;
    case "Source":
      curPkg.Source = value.trim().split(" ")[0];
      break;
    case "Provides":
      for (let name of value.split(",")) {
        name = name.trim().split(" ")[0];
        curPkg.Provides.push(name);
      }
      break;
    case "Pre-Depends":
    case "Depends":
      for (const depElem of value.split(",")) {
        for (let name of depElem.split("|")) {
          name = name.trim().split(" ")[0];
          curPkg.Deps[name] = true;
        }
      }
      break;
  }
  return curPkg;
}

function setAutoInstalledPackages(text: string, pkgs: AnalyzerPkg[]) {
  const autoPkgs = parseExtFile(text);
  for (const pkg of pkgs) {
    if (autoPkgs[pkg.Name]) {
      pkg.AutoInstalled = true;
    }
  }
}

interface PkgMap {
  [name: string]: boolean;
}

function parseExtFile(text: string) {
  const pkgMap: PkgMap = {};
  let curPkgName: any = null;
  for (const line of text.split("\n")) {
    curPkgName = parseExtLine(line, curPkgName, pkgMap);
  }
  return pkgMap;
}

function parseExtLine(text: string, curPkgName: string, pkgMap: PkgMap) {
  const [key, value] = text.split(": ");
  switch (key) {
    case "Package":
      curPkgName = value;
      break;
    case "Auto-Installed":
      if (parseInt(value, 10) === 1) {
        pkgMap[curPkgName] = true;
      }
      break;
  }
  return curPkgName;
}
