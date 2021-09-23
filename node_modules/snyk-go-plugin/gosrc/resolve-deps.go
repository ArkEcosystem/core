package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"
	"strings"

	"./resolver"
)

func prettyPrintJSON(j interface{}) {
	e := json.NewEncoder(os.Stdout)
	e.SetIndent("", "  ")
	e.Encode(j)
}

func main() {
	flag.Usage = func() {
		fmt.Println(`  Scans the imports from all Go packages (and subpackages) rooted in current dir,
  and prints the dependency graph in a JSON format that can be imported via npmjs.com/graphlib.
		`)
		flag.PrintDefaults()
		fmt.Println("")
	}
	var ignoredPkgs = flag.String("ignoredPkgs", "", "Comma separated list of packages (canonically named) to ignore when scanning subfolders")
	var outputDOT = flag.Bool("dot", false, "Output as Graphviz DOT format")
	var outputList = flag.Bool("list", false, "Output a flat JSON array of all reachable deps")
	flag.Parse()

	ignoredPkgsList := strings.Split(*ignoredPkgs, ",")

	var rc resolver.ResolveContext
	err := rc.ResolvePath(".", ignoredPkgsList)
	if err != nil {
		panic(err)
	}

	graph := rc.GetGraph()

	if *outputDOT {
		fmt.Println(graph.ToDOT())
	} else if *outputList {
		prettyPrintJSON(graph.SortedNodeNames())
	} else {
		prettyPrintJSON(graph)
	}

	unresolved := rc.GetUnresolvedPackages()
	if len(unresolved) != 0 {
		fmt.Println("\nUnresolved packages:")

		sort.Strings(unresolved)
		for _, pkg := range unresolved {
			fmt.Println(" - ", pkg)
		}

		os.Exit(1)
	}
}
