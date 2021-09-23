import { DockerfileParser } from "dockerfile-ast";
import * as fs from "fs";
import {
  DockerFileLayers,
  DockerFilePackages,
  getDockerfileBaseImageName,
  getDockerfileLayers,
  getPackagesFromRunInstructions,
} from "./instruction-parser";

export { analyseDockerfile, readDockerfileAndAnalyse, DockerFileAnalysis };

interface DockerFileAnalysis {
  baseImage?: string;
  dockerfilePackages: DockerFilePackages;
  dockerfileLayers: DockerFileLayers;
}

async function readDockerfileAndAnalyse(
  targetFilePath?: string,
): Promise<DockerFileAnalysis | undefined> {
  if (!targetFilePath) {
    return undefined;
  }

  const contents = await readFile(targetFilePath);
  return analyseDockerfile(contents);
}

async function analyseDockerfile(
  contents: string,
): Promise<DockerFileAnalysis | undefined> {
  const dockerfile = DockerfileParser.parse(contents);
  const baseImage = getDockerfileBaseImageName(dockerfile);
  const dockerfilePackages = getPackagesFromRunInstructions(dockerfile);
  const dockerfileLayers = getDockerfileLayers(dockerfilePackages);
  return {
    baseImage,
    dockerfilePackages,
    dockerfileLayers,
  };
}

async function readFile(path: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      return err ? reject(err) : resolve(data);
    });
  }) as Promise<string>;
}
