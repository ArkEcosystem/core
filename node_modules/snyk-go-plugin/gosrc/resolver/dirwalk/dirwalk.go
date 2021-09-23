package dirwalk

import (
	"os"
	"path/filepath"
	"strings"
)

// WalkGoFolders will call cb for every folder with Go code under the given root path,
// unless it's:
// - one of "vendor", "Godeps", "node_modules", "testdata", "internal"
// - starts with "." or "_"
// - is a test package, i.e. ends with _test
func WalkGoFolders(root string, cb WalkFunc) error {
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		// if it's not a folder (or a symlink to folder), do nothing
		if info.Mode()&os.ModeSymlink > 0 {
			info, err = os.Stat(path)
			if err != nil {
				return err
			}
		}
		if !info.IsDir() {
			return nil
		}

		folderName := info.Name()
		switch folderName {
		case "vendor", "Godeps", "node_modules", "testdata", "internal":
			return filepath.SkipDir
		}
		if strings.HasSuffix(folderName, "_test") ||
			(folderName != "." && strings.HasPrefix(folderName, ".")) ||
			strings.HasPrefix(folderName, "_") {
			return filepath.SkipDir
		}

		gofiles, err := filepath.Glob(filepath.Join(path, "*.go"))
		if err != nil {
			return nil
		}

		if len(gofiles) > 0 {
			return cb(path)
		}

		return nil
	})
	return err
}

// WalkFunc defines the prototype for WalkGoFolders's callback.
// the error passed as the return value of the undrelying filepath.Walk
type WalkFunc func(path string) error
