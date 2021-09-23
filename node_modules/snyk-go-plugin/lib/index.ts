import * as fs from 'fs';
import * as path from 'path';
import * as graphlib from 'graphlib';
import * as tmp from 'tmp';
import * as os from 'os';
import debugLib = require('debug');

import * as subProcess from './sub-process';
import { CustomError } from './errors/custom-error';

import {
  parseGoPkgConfig, parseGoVendorConfig, GoPackageManagerType, GoProjectConfig, toSnykVersion, parseVersion,
} from 'snyk-go-parser';

const debug = debugLib('snyk-go-plugin');

const VIRTUAL_ROOT_NODE_ID = '.';

export interface DepDict {
  [name: string]: DepTree;
}

export interface DepTree {
  name: string;
  version?: string;
  dependencies?: DepDict;
  packageFormatVersion?: string;

  _counts?: any;
  _isProjSubpkg?: boolean;
}

interface CountDict {
  [k: string]: number;
}

interface Options {
  debug?: boolean;
}

export async function inspect(root, targetFile, options: Options = {}) {
  options.debug ? debugLib.enable('snyk-go-plugin') : debugLib.disable();

  const result = await Promise.all([
    getMetaData(root, targetFile),
    getDependencies(root, targetFile),
  ]);
  return {
    plugin: result[0],
    package: result[1],
  };
}

async function getMetaData(root, targetFile) {
  const output = await subProcess.execute('go', ['version'], {cwd: root});
  const versionMatch = /(go\d+\.?\d+?\.?\d*)/.exec(output);
  const runtime = (versionMatch) ? versionMatch[0] : undefined;

  return {
    name: 'snyk-go-plugin',
    runtime,
    targetFile: pathToPosix(targetFile),
  };
}

function createAssets() {
  // path.join calls have to be exactly in this format, needed by "pkg" to build a standalone Snyk CLI binary:
  // https://www.npmjs.com/package/pkg#detecting-assets-in-source-code
  return [
    path.join(__dirname, '../gosrc/resolve-deps.go'),
    path.join(__dirname, '../gosrc/resolver/pkg.go'),
    path.join(__dirname, '../gosrc/resolver/resolver.go'),
    path.join(__dirname, '../gosrc/resolver/dirwalk/dirwalk.go'),
    path.join(__dirname, '../gosrc/resolver/graph/graph.go'),
  ];
}

function writeFile(writeFilePath, contents) {
  const dirPath = path.dirname(writeFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  fs.writeFileSync(writeFilePath, contents);
}

function getFilePathRelativeToDumpDir(filePath) {
  let pathParts = filePath.split('\\gosrc\\');

  // Windows
  if (pathParts.length > 1) {
    return pathParts[1];
  }

  // Unix
  pathParts = filePath.split('/gosrc/');
  return pathParts[1];
}

function dumpAllResolveDepsFilesInTempDir(tempDirName) {
  createAssets().forEach((currentReadFilePath) => {
    if (!fs.existsSync(currentReadFilePath)) {
      throw new Error('The file `' + currentReadFilePath + '` is missing');
    }

    const relFilePathToDumpDir =
      getFilePathRelativeToDumpDir(currentReadFilePath);

    const writeFilePath = path.join(tempDirName, relFilePathToDumpDir);

    const contents = fs.readFileSync(currentReadFilePath);
    writeFile(writeFilePath, contents);
  });
}

const PACKAGE_MANAGER_BY_TARGET: {[k: string]: GoPackageManagerType}  = {
  'Gopkg.lock': 'golangdep',
  'vendor.json': 'govendor',
  'go.mod': 'gomodules',
};

const VENDOR_SYNC_CMD_BY_PKG_MANAGER: {[k in GoPackageManagerType]: string} = {
  golangdep: 'dep ensure',
  govendor: 'govendor sync',
  gomodules: 'go mod download',
};

async function getDependencies(root, targetFile) {
  let tempDirObj;
  const packageManager = pkgManagerByTarget(targetFile);
  if (packageManager === 'gomodules') {
    return buildDepTreeFromImportsAndModules(root);
  }

  try {
    debug('parsing manifest/lockfile', {root, targetFile});
    const config = parseConfig(root, targetFile);
    tempDirObj = tmp.dirSync({
      unsafeCleanup: true,
    });

    dumpAllResolveDepsFilesInTempDir(tempDirObj.name);

    const goResolveTool =
      path.join(tempDirObj.name, 'resolve-deps.go');
    let ignorePkgsParam;
    if (config.ignoredPkgs && config.ignoredPkgs.length > 0) {
      ignorePkgsParam = '-ignoredPkgs=' + config.ignoredPkgs.join(',');
    }
    const args = ['run', goResolveTool, ignorePkgsParam];
    debug('executing go deps resolver', {cmd: 'go' + args.join(' ')});
    const graphStr = await subProcess.execute(
      'go',
      args,
      {cwd: root},
    );
    tempDirObj.removeCallback();
    debug('loading deps resolver graph output to graphlib', {jsonSize: graphStr.length});
    const graph = graphlib.json.read(JSON.parse(graphStr));

    if (!graphlib.alg.isAcyclic(graph)) {
      throw new Error(
        'Go import cycle detected (not allowed by the Go compiler)');
    }

    // A project can contain several "entry points",
    // i.e. pkgs with no local dependants.
    // To create a tree, we add edges from a "virutal root",
    // to these source nodes.
    const rootNode = graph.node(VIRTUAL_ROOT_NODE_ID);
    if (!rootNode) {
      throw new Error('Failed parsing dependency graph');
    }

    graph.sources().forEach((nodeId) => {
      if (nodeId !== VIRTUAL_ROOT_NODE_ID) {
        graph.setEdge(VIRTUAL_ROOT_NODE_ID, nodeId);
      }
    });

    const projectRootPath = getProjectRootFromTargetFile(targetFile);

    debug('building dep-tree');
    const pkgsTree = recursivelyBuildPkgTree(
      graph, rootNode, config.lockedVersions, projectRootPath, {});
    delete pkgsTree._counts;

    pkgsTree.packageFormatVersion = 'golang:0.0.1';
    debug('done building dep-tree', {rootPkgName: pkgsTree.name});

    return pkgsTree;
  } catch (error) {
    if (tempDirObj) {
      tempDirObj.removeCallback();
    }
    if (typeof error === 'string') {
      const unresolvedOffset = error.indexOf('Unresolved packages:');
      if (unresolvedOffset !== -1) {
        throw new Error(
          error.slice(unresolvedOffset) + '\n' +
          'Unresolved imports found, please run `' +
          syncCmdForTarget(targetFile) + '`');
      }
      throw new Error(error);
    }
    throw error;
  }
}

function pkgManagerByTarget(targetFile): GoPackageManagerType {
  const fname = path.basename(targetFile);
  return PACKAGE_MANAGER_BY_TARGET[fname];
}

function syncCmdForTarget(targetFile) {
  return VENDOR_SYNC_CMD_BY_PKG_MANAGER[
    pkgManagerByTarget(targetFile)];
}

function getProjectRootFromTargetFile(targetFile) {
  const resolved = path.resolve(targetFile);
  const parts = resolved.split(path.sep);

  if (parts[parts.length - 1] === 'Gopkg.lock') {
    return path.dirname(resolved);
  }

  if (
    parts[parts.length - 1] === 'vendor.json' &&
    parts[parts.length - 2] === 'vendor') {
    return path.dirname(path.dirname(resolved));
  }

  if (parts[parts.length - 1] === 'go.mod') {
    return path.dirname(resolved);
  }

  throw new Error('Unsupported file: ' + targetFile);
}

function recursivelyBuildPkgTree(
  graph,
  node,
  lockedVersions,
  projectRootPath,
  totalPackageOccurenceCounter: CountDict,
): DepTree {

  const isRoot = (node.Name === VIRTUAL_ROOT_NODE_ID);

  const isProjSubpkg = isProjSubpackage(node.Dir, projectRootPath);

  const pkg: DepTree = {
    name: (isRoot ? node.FullImportPath : node.Name),
    dependencies: {},
  };
  if (!isRoot && isProjSubpkg) {
    pkg._isProjSubpkg = true;
  }

  if (isRoot || isProjSubpkg) {
    pkg.version = '';
  } else if (!lockedVersions[pkg.name]) {
    pkg.version = '';
    // TODO: warn or set to "?" ?
  } else {
    pkg.version = lockedVersions[pkg.name].version;
  }

  const children = graph.successors(node.Name).sort();
  children.forEach((depName) => {

    // We drop whole dep tree branches for frequently repeatedpackages:
    // this loses some paths, but avoids explosion in result size
    if ((totalPackageOccurenceCounter[depName] || 0) > 10) {
      return;
    }

    const dep = graph.node(depName);

    const child = recursivelyBuildPkgTree(
      graph,
      dep,
      lockedVersions,
      projectRootPath,
      totalPackageOccurenceCounter,
    );

    if (child._isProjSubpkg) {
      Object.keys(child.dependencies!).forEach((grandChildName) => {
        // We merge all the subpackages of the project into the root project, by transplanting dependencies of the
        // subpackages one level up.
        // This is done to decrease the tree size - and to be similar to other languages, where we are only showing
        // dependencies at the project level, not at the level of individual code sub-directories (which Go packages
        // are, essentially).
        if (!pkg.dependencies![grandChildName]) {
          pkg.dependencies![grandChildName] = child.dependencies![grandChildName];
        }
      });
      // Even though subpackages are not preserved in the result, we still need protection from combinatorial explosion
      // while scanning the tree.
      totalPackageOccurenceCounter[child.name] = (totalPackageOccurenceCounter[child.name] || 0) + 1;
    } else {
      // in case was already added via a grandchild
      if (!pkg.dependencies![child.name]) {
        pkg.dependencies![child.name] = child;
        totalPackageOccurenceCounter[child.name] = (totalPackageOccurenceCounter[child.name] || 0) + 1;
      }
    }
  });

  return pkg;
}

function isProjSubpackage(pkgPath, projectRootPath) {
  if (pkgPath === projectRootPath) {
    return true;
  }

  let root = projectRootPath;
  root =
   (root[root.length - 1] === path.sep) ? root : (root + path.sep);

  if (pkgPath.indexOf(root) !== 0) {
    return false;
  }

  const pkgRelativePath = pkgPath.slice(root.length);
  if (pkgRelativePath.split(path.sep).indexOf('vendor') !== -1) {
    return false;
  }

  return true;
}

interface LockedDep {
  name: string;
  version: string;
}

interface LockedDeps {
  [dep: string]: LockedDep;
}

interface DepManifest {
  ignored: string[];
}

function parseConfig(root, targetFile): GoProjectConfig {
  const pkgManager = pkgManagerByTarget(targetFile);
  debug('detected package-manager:', pkgManager);
  switch (pkgManager) {
    case 'golangdep': {
      try {
        return parseGoPkgConfig(getDepManifest(root, targetFile), getDepLock(root, targetFile));
      } catch (e) {
        throw (new Error('failed parsing manifest/lock files for Go dep: ' + e.message));
      }
    }
    case 'govendor': {
      try {
        return parseGoVendorConfig(getGovendorJson(root, targetFile));
      } catch (e) {
        throw (new Error('failed parsing config file for Go Vendor Tool: ' + e.message));
      }
    }
    default: {
      throw new Error('Unsupported file: ' + targetFile);
    }
  }

}

function getDepLock(root, targetFile): string {
  return fs.readFileSync(path.join(root, targetFile), 'utf8');
}

function getDepManifest(root, targetFile): string {
  const manifestDir = path.dirname(path.join(root, targetFile));
  const manifestPath = path.join(manifestDir, 'Gopkg.toml');

  return fs.readFileSync(manifestPath, 'utf8');
}

// TODO: branch, old Version can be a tag too?
function getGovendorJson(root, targetFile): string {
  return fs.readFileSync(path.join(root, targetFile), 'utf8');
}

function pathToPosix(fpath) {
  const parts = fpath.split(path.sep);
  return parts.join(path.posix.sep);
}

// https://golang.org/cmd/go/#hdr-List_packages_or_modules
interface GoPackage {
  Dir: string; // directory containing package sources
  ImportPath: string; // import path of package in dir
  ImportComment?: string; // path in import comment on package statement
  Name: string; // package name
  Doc?: string; // package documentation string
  Target?: string; // install path
  Shlib?: string; // the shared library that contains this package (only set when -linkshared)
  Goroot?: boolean; // is this package in the Go root?
  Standard?: boolean; // is this package part of the standard Go library?
  Stale?: boolean; // would 'go install' do anything for this package?
  StaleReason?: string; // explanation for Stale==true
  Root?: string; // Go root or Go path dir containing this package
  ConflictDir?: string; // this directory shadows Dir in $GOPATH
  BinaryOnly?: boolean; // binary-only package: cannot be recompiled from sources
  ForTest?: string; // package is only for use in named test
  Export?: string; // file containing export data (when using -export)
  Module?: GoModule; // info about package's containing module, if any (can be nil)
  Match?: string[]; // command-line patterns matching this package
  DepOnly?: boolean; // package is only a dependency, not explicitly listed
  // Dependency information
  Imports?: string[]; // import paths used by this package
  ImportMap: { string: string }; // map from source import to ImportPath (identity entries omitted)
  Deps: string[]; // all (recursively) imported dependencies
  TestImports: string[]; // imports from TestGoFiles
  XTestImports: string[]; // imports from XTestGoFiles
  // Error information
  Incomplete: boolean; // this package or a dependency has an error
  Error: GoPackageError; // error loading package
  DepsErrors: GoPackageError[]; // errors loading dependencies
}

// https://golang.org/cmd/go/#hdr-List_packages_or_modules
interface GoModule {
  Path: string; // module path
  Version: string; // module version
  Versions: string[]; // available module versions (with -versions)
  Replace: GoModule; // replaced by this module
  Time: string; // time version was created
  Update: GoModule; // available update, if any (with -u)
  Main: boolean; // is this the main module?
  Indirect: boolean; // is this module only an indirect dependency of main module?
  Dir: string; // directory holding files for this module, if any
  GoMod: string; // path to go.mod file for this module, if any
  Error: string; // error loading module
}

// https://golang.org/cmd/go/#hdr-List_packages_or_modules
interface GoPackageError {
  ImportStack: string[]; // shortest path from package named on command line to this one
  Pos: string; // position of error (if present, file:line:col)
  Err: string; // the error itself
}

interface GoPackagesByName {
  [name: string]: GoPackage;
}

// TODO(kyegupov): move to a separate file
export async function buildDepTreeFromImportsAndModules(root: string = '.') {

  // TODO(BST-657): parse go.mod file to obtain root module name and go version

  const depTree: DepTree = {
    name: path.basename(root), // The correct name should come from the `go list` command
    version: '0.0.0', // TODO(BST-657): try `git describe`?
    packageFormatVersion: 'golang:0.0.1',
  };

  let goDepsOutput: string;
  try {
    goDepsOutput = await subProcess.execute('go list', ['-json', '-deps', './...'], { cwd: root } );

  } catch (err) {
    const userError = new CustomError(err);
    userError.userMessage = "'go list -json -deps ./...' command failed with error: " + userError.message;
    throw userError;
  }

  if (goDepsOutput.includes('matched no packages')) {
    return depTree;
  }
  const goDepsString = `[${goDepsOutput.replace(/}\r?\n{/g, '},{')}]`;
  const goDeps: GoPackage[] = JSON.parse(goDepsString);
  const packagesByName: GoPackagesByName = {};
  for (const gp of goDeps) {
    packagesByName[gp.ImportPath] = gp; // ImportPath is the fully qualified name
  }

  const localPackages = goDeps.filter((gp) => !gp.DepOnly);
  const localPackageWithMainModule = localPackages
      .find((localPackage) => (localPackage.Module && localPackage.Module.Main));
  if (localPackageWithMainModule && localPackageWithMainModule!.Module!.Path) {
    depTree.name = localPackageWithMainModule!.Module!.Path;
  }

  const topLevelDeps = extractAllImports(localPackages);
  buildTree(depTree, topLevelDeps, packagesByName);
  return depTree;
}

function buildTree(
  depTreeNode: DepTree,
  depPackages: string[],
  packagesByName: GoPackagesByName,
) {
  for (const packageImport of depPackages) {
    let version = 'unknown';
    if (isBuiltinPackage(packageImport)) {
      // We do not track vulns in Go standard library
      continue;
    } else if (!packagesByName[packageImport].DepOnly) {
      // Do not include packages of this module
      continue;
    } else {
      const pkg = packagesByName[packageImport]!;
      if (pkg.Module && pkg.Module.Version) {
        version = toSnykVersion(parseVersion(pkg.Module.Version));
      }
      const newNode = {
        name: packageImport,
        version,
      };
      if (!depTreeNode.dependencies) {
        depTreeNode.dependencies = {};
      }
      depTreeNode.dependencies![packageImport] = newNode;
      if (packagesByName[packageImport].Imports) {
        buildTree(newNode, packagesByName[packageImport].Imports!, packagesByName);
      }
    }
  }
}

function extractAllImports(goDeps: GoPackage[]): string[] {
  const goDepsImports = new Set<string>();
  for (const pkg of goDeps) {
    if (pkg.Imports) {
      for (const imp of pkg.Imports) {
        goDepsImports.add(imp);
      }
    }
  }
  return Array.from(goDepsImports);
}

// Better error message than JSON.parse
export function jsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch (e) {
    e.message = e.message + ', original string: "' + s + '"';
    throw e;
  }
}

function isBuiltinPackage(pkgName: string): boolean {
  // Non-builtin packages have domain names in them that contain dots
  return pkgName.indexOf('.') === -1;
}
