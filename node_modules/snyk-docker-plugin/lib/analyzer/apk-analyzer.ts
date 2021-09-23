import { Docker, DockerOptions } from "../docker";
import { AnalyzerPkg } from "./types";
export { analyze };

function analyze(targetImage: string, options?: DockerOptions) {
  return getPackages(targetImage, options).then((pkgs) => ({
    Image: targetImage,
    AnalyzeType: "Apk",
    Analysis: pkgs,
  }));
}

function getPackages(targetImage: string, options?: DockerOptions) {
  return new Docker(targetImage, options)
    .catSafe("/lib/apk/db/installed")
    .then((output) => parseFile(output.stdout));
}

function parseFile(text: string) {
  const pkgs: AnalyzerPkg[] = [];
  let curPkg: any = null;
  for (const line of text.split("\n")) {
    curPkg = parseLine(line, curPkg, pkgs);
  }
  return pkgs;
}

function parseLine(text: string, curPkg: AnalyzerPkg, pkgs: AnalyzerPkg[]) {
  const key = text.charAt(0);
  const value = text.substr(2);
  switch (key) {
    case "P": // Package
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
    case "V": // Version
      curPkg.Version = value;
      break;
    case "p": // Provides
      for (let name of value.split(" ")) {
        name = name.split("=")[0];
        curPkg.Provides.push(name);
      }
      break;
    case "r": // Depends
    case "D": // Depends
      // tslint:disable-next-line:no-duplicate-variable
      for (let name of value.split(" ")) {
        if (name.charAt(0) !== "!") {
          name = name.split("=")[0];
          curPkg.Deps[name] = true;
        }
      }
      break;
  }
  return curPkg;
}
