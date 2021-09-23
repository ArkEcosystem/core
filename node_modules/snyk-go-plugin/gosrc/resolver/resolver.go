/*
This code is based on https://github.com/KyleBanks/depth

MIT License

Copyright (c) 2017 Kyle Banks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

package resolver

import (
	"fmt"
	"go/build"
	"path/filepath"
	"strings"

	"./dirwalk"
	"./graph"
)

// ResolveContext represents all the pkg trees rooted at all the subfolders with Go code.
type ResolveContext struct {
	roots []*Pkg

	unresolvedPkgs map[string]struct{}
	pkgCache       map[string]*Pkg
	importCache    map[string]struct{}

	ignoredPkgs []string
}

// ResolvePath recursively finds all direct & transitive dependencies for all the packages (and sub-packages),
// rooted at given path
func (rc *ResolveContext) ResolvePath(rootPath string, ignoredPkgs []string) error {
	rc.init()
	rc.ignoredPkgs = ignoredPkgs

	abs, err := filepath.Abs(rootPath)
	if err != nil {
		return fmt.Errorf("filepath.Abs(%s) failed with: %s", rootPath, err.Error())
	}
	rootPath = abs

	virtualRootPkg, err := rc.resolveVirtualRoot(rootPath)
	if err != nil {
		return err
	}
	rc.roots = append(rc.roots, virtualRootPkg)

	return dirwalk.WalkGoFolders(rootPath, func(path string) error {
		rootPkg := rc.resolveFolder(path)
		if rootPkg.isResolved {
			rc.roots = append(rc.roots, rootPkg)
		}

		return nil
	})
}

// GetUnresolvedPackages returns a list of all the pkgs that failed to resolve
func (rc ResolveContext) GetUnresolvedPackages() []string {
	unresolved := []string{}
	for pkg := range rc.unresolvedPkgs {
		unresolved = append(unresolved, pkg)
	}
	return unresolved
}

// GetGraph returns the graph of resolved packages
func (rc *ResolveContext) GetGraph() graph.Graph {
	nodesMap := map[string]graph.Node{}
	edgesMap := map[string]graph.Edge{}

	var recurse func(pkg *Pkg)
	recurse = func(pkg *Pkg) {
		_, exists := nodesMap[pkg.Name]
		if exists {
			return
		}

		node := graph.Node{
			Name:  pkg.Name,
			Value: *pkg,
		}
		nodesMap[pkg.Name] = node

		for _, child := range pkg.deps {
			edge := graph.Edge{
				From: pkg.Name,
				To:   child.Name,
			}
			edgesMap[pkg.Name+":"+child.Name] = edge

			recurse(&child)
		}
	}

	for _, r := range rc.roots {
		recurse(r)
	}

	var nodes []graph.Node
	for _, v := range nodesMap {
		nodes = append(nodes, v)
	}

	var edges []graph.Edge
	for _, v := range edgesMap {
		edges = append(edges, v)
	}

	return graph.Graph{
		Nodes: nodes,
		Edges: edges,
		Options: graph.Options{
			Directed: true,
		},
	}
}

func (rc *ResolveContext) init() {
	rc.roots = []*Pkg{}
	rc.importCache = map[string]struct{}{}
	rc.unresolvedPkgs = map[string]struct{}{}
	rc.pkgCache = map[string]*Pkg{}
}

func (rc *ResolveContext) resolveVirtualRoot(rootPath string) (*Pkg, error) {
	rootImport, err := build.Default.Import(".", rootPath, build.FindOnly)
	if err != nil {
		return nil, err
	}
	if rootImport.ImportPath == "" || rootImport.ImportPath == "." {
		return nil, fmt.Errorf("Can't resolve root package at %s.\nIs $GOPATH defined correctly?", rootPath)
	}

	virtualRootPkg := &Pkg{
		Name:           ".",
		FullImportPath: rootImport.ImportPath,
		Dir:            rootImport.Dir,
	}

	return virtualRootPkg, nil
}

func (rc *ResolveContext) resolveFolder(path string) *Pkg {
	rootPkg := &Pkg{
		Name:           ".",
		resolveContext: rc,
		parentDir:      path,
	}
	rootPkg.Resolve()
	rootPkg.Name = rootPkg.FullImportPath

	return rootPkg
}

// hasSeenImport returns true if the import name provided has already been seen within the tree.
// This function only returns false for a name once.
func (rc *ResolveContext) hasSeenImport(name string) bool {
	if _, ok := rc.importCache[name]; ok {
		return true
	}
	rc.importCache[name] = struct{}{}
	return false
}

func (rc *ResolveContext) markUnresolvedPkg(name string) {
	rc.unresolvedPkgs[name] = struct{}{}
}

func (rc *ResolveContext) cacheResolvedPackage(pkg *Pkg) {
	rc.pkgCache[pkg.Name] = pkg
}

func (rc *ResolveContext) getCachedPkg(name string) *Pkg {
	pkg, ok := rc.pkgCache[name]
	if !ok {
		return nil
	}
	return pkg
}

func (rc ResolveContext) shouldIgnorePkg(name string) bool {
	for _, ignored := range rc.ignoredPkgs {
		if name == ignored {
			return true
		}

		if strings.HasSuffix(ignored, "*") {
			// note that ignoring "url/to/pkg*" will also ignore "url/to/pkg-other",
			// this is quite confusing, but is dep's behaviour
			if strings.HasPrefix(name, strings.TrimSuffix(ignored, "*")) {
				return true
			}
		}
	}

	return false
}
