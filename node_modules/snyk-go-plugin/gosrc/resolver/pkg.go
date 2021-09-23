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
	"go/build"
	"path"
	"sort"
	"strings"
)

// Pkg represents a Go source package, and its dependencies.
type Pkg struct {
	Name           string
	FullImportPath string
	Dir            string

	raw *build.Package

	isBuiltin      bool
	isResolved     bool
	parentDir      string
	deps           []Pkg
	parent         *Pkg
	resolveContext *ResolveContext
}

// Resolve recursively finds all dependencies for the Pkg and the packages it depends on.
func (p *Pkg) Resolve() {
	// isResolved is always true, regardless of if we skip the import,
	// it is only false if there is an error while importing.
	p.isResolved = true

	name := p.cleanName()
	if name == "" {
		return
	}

	// Stop resolving imports if we've reached a loop.
	var importMode build.ImportMode
	if p.resolveContext.hasSeenImport(name) && p.isAncestor(name) {
		importMode = build.FindOnly
	}

	pkg, err := build.Default.Import(name, p.parentDir, importMode)
	if err != nil {
		// TODO: Check the error type?
		p.isResolved = false
		// this is package we dediced to scan, and probably shouldn't have.
		// probably can remove this when we have handling of build tags
		if name != "." {
			p.resolveContext.markUnresolvedPkg(name)
		}
		return
	}
	if name == "." && p.resolveContext.shouldIgnorePkg(pkg.ImportPath) {
		p.isResolved = false
		return
	}

	p.raw = pkg
	p.Dir = pkg.Dir

	// Clear some too verbose fields
	p.raw.ImportPos = nil
	p.raw.TestImportPos = nil

	// Update the name with the fully qualified import path.
	p.FullImportPath = pkg.ImportPath
	// If this is an builtin package, we don't resolve deeper
	if pkg.Goroot {
		p.isBuiltin = true
		return
	}

	imports := pkg.Imports
	p.setDeps(imports, pkg.Dir)
}

// setDeps takes a slice of import paths and the source directory they are relative to,
// and creates the deps of the Pkg. Each dependency is also further resolved prior to being added
// to the Pkg.
func (p *Pkg) setDeps(imports []string, parentDir string) {
	unique := make(map[string]struct{})

	for _, imp := range imports {
		// Mostly for testing files where cyclic imports are allowed.
		if imp == p.Name {
			continue
		}

		// Skip duplicates.
		if _, ok := unique[imp]; ok {
			continue
		}
		unique[imp] = struct{}{}

		if p.resolveContext.shouldIgnorePkg(imp) {
			continue
		}

		p.addDep(imp, parentDir)
	}

	sort.Sort(sortablePkgsList(p.deps))
}

// addDep creates a Pkg and it's dependencies from an imported package name.
func (p *Pkg) addDep(name string, parentDir string) {
	var dep Pkg
	cached := p.resolveContext.getCachedPkg(name)
	if cached != nil {
		dep = *cached
		dep.parentDir = parentDir
		dep.parent = p
	} else {
		dep = Pkg{
			Name:           name,
			resolveContext: p.resolveContext,
			//TODO: maybe better pass parentDir as a param to Resolve() instead
			parentDir: parentDir,
			parent:    p,
		}
		dep.Resolve()

		p.resolveContext.cacheResolvedPackage(&dep)
	}

	if dep.isBuiltin || dep.Name == "C" {
		return
	}

	if isInternalImport(dep.Name) {
		p.deps = append(p.deps, dep.deps...)
	} else {
		p.deps = append(p.deps, dep)
	}
}

// isAncestor goes recursively up the chain of Pkgs to determine if the name provided is ever a
// parent of the current Pkg.
func (p *Pkg) isAncestor(name string) bool {
	if p.parent == nil {
		return false
	}

	if p.parent.Name == name {
		return true
	}

	return p.parent.isAncestor(name)
}

// cleanName returns a cleaned version of the Pkg name used for resolving dependencies.
//
// If an empty string is returned, dependencies should not be resolved.
func (p *Pkg) cleanName() string {
	name := p.Name

	// C 'package' cannot be resolved.
	if name == "C" {
		return ""
	}

	// Internal golang_org/* packages must be prefixed with vendor/
	//
	// Thanks to @davecheney for this:
	// https://github.com/davecheney/graphpkg/blob/master/main.go#L46
	if strings.HasPrefix(name, "golang_org") {
		name = path.Join("vendor", name)
	}

	return name
}

func isInternalImport(importPath string) bool {
	return strings.Contains(importPath, "/internal/")
}

// sortablePkgsList ensures a slice of Pkgs are sorted such that the builtin stdlib
// packages are always above external packages (ie. github.com/whatever).
type sortablePkgsList []Pkg

func (b sortablePkgsList) Len() int {
	return len(b)
}

func (b sortablePkgsList) Swap(i, j int) {
	b[i], b[j] = b[j], b[i]
}

func (b sortablePkgsList) Less(i, j int) bool {
	if b[i].isBuiltin && !b[j].isBuiltin {
		return true
	} else if !b[i].isBuiltin && b[j].isBuiltin {
		return false
	}

	return b[i].Name < b[j].Name
}
