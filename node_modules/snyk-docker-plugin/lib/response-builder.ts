// Module that provides functions to collect and build response after all
// analyses' are done.

import { DockerFilePackages, instructionDigest } from "./instruction-parser";

export { buildResponse };

function buildResponse(
  runtime,
  depsAnalysis,
  dockerfileAnalysis,
  manifestFiles,
  options,
) {
  const deps = depsAnalysis.package.dependencies;
  const dockerfilePkgs = collectDockerfilePkgs(dockerfileAnalysis, deps);
  const finalDeps = excludeBaseImageDeps(deps, dockerfilePkgs, options);
  annotateLayerIds(finalDeps, dockerfilePkgs);
  const plugin = pluginMetadataRes(runtime, depsAnalysis);
  const pkg = packageRes(
    depsAnalysis,
    dockerfileAnalysis,
    dockerfilePkgs,
    finalDeps,
  );

  return {
    plugin,
    package: pkg,
    manifestFiles,
  };
}

function pluginMetadataRes(runtime, depsAnalysis) {
  return {
    name: "snyk-docker-plugin",
    runtime,
    packageManager: depsAnalysis.packageManager,
    dockerImageId: depsAnalysis.imageId,
    imageLayers: depsAnalysis.imageLayers,
  };
}

function packageRes(depsAnalysis, dockerfileAnalysis, dockerfilePkgs, deps) {
  return {
    ...depsAnalysis.package,
    dependencies: deps,
    docker: {
      ...depsAnalysis.package.docker,
      ...dockerfileAnalysis,
      dockerfilePackages: dockerfilePkgs,
      binaries: depsAnalysis.binaries,
    },
  };
}

function collectDockerfilePkgs(dockerAnalysis, deps) {
  if (!dockerAnalysis) {
    return;
  }

  return getDockerfileDependencies(dockerAnalysis.dockerfilePackages, deps);
}

// Iterate over the dependencies list; if one is introduced by the dockerfile,
// flatten its dependencies and append them to the list of dockerfile
// packages. This gives us a reference of all transitive deps installed via
// the dockerfile, and the instruction that installed it.
function getDockerfileDependencies(
  dockerfilePackages: DockerFilePackages,
  dependencies,
): DockerFilePackages {
  for (const dependencyName in dependencies) {
    if (dependencies.hasOwnProperty(dependencyName)) {
      const sourceOrName = dependencyName.split("/")[0];
      const dockerfilePackage = dockerfilePackages[sourceOrName];

      if (dockerfilePackage) {
        collectDeps(dependencies[dependencyName]).forEach((dep) => {
          dockerfilePackages[dep.split("/")[0]] = { ...dockerfilePackage };
        });
      }
    }
  }

  return dockerfilePackages;
}

function collectDeps(pkg) {
  // ES5 doesn't have Object.values, so replace with Object.keys() and map()
  return pkg.dependencies
    ? Object.keys(pkg.dependencies)
        .map((name) => pkg.dependencies[name])
        .reduce((allDeps, pkg) => {
          return [...allDeps, ...collectDeps(pkg)];
        }, Object.keys(pkg.dependencies))
    : [];
}

// Skip processing if option disabled or dockerfilePkgs is undefined. We
// can't exclude anything in that case, because we can't tell which deps are
// from dockerfile and which from base image.
function excludeBaseImageDeps(deps, dockerfilePkgs, options = {}) {
  if (!options["exclude-base-image-vulns"] || !dockerfilePkgs) {
    return deps;
  }

  return extractDockerfileDeps(deps, dockerfilePkgs);
}

function extractDockerfileDeps(allDeps, dockerfilePkgs) {
  return Object.keys(allDeps)
    .filter((depName) => dockerfilePkgs[depName])
    .reduce((extractedDeps, depName) => {
      extractedDeps[depName] = allDeps[depName];
      return extractedDeps;
    }, {});
}

function annotateLayerIds(deps, dockerfilePkgs) {
  if (!dockerfilePkgs) {
    return;
  }

  Object.keys(deps).forEach((dep) => {
    const pkg = deps[dep];
    const dockerfilePkg = dockerfilePkgs[dep];
    if (dockerfilePkg) {
      pkg.labels = {
        ...(pkg.labels || {}),
        dockerLayerId: instructionDigest(dockerfilePkg.instruction),
      };
    }
    if (pkg.dependencies) {
      annotateLayerIds(pkg.dependencies, dockerfilePkgs);
    }
  });
}
