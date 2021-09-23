package graph

import (
	"fmt"
	"sort"
)

// Node is Grpah's node
type Node struct {
	Name  string      `json:"v"`
	Value interface{} `json:"value"`
}

// Edge is Graph's edge
type Edge struct {
	From string `json:"v"`
	To   string `json:"w"`
}

// Options is Graph's options
type Options struct {
	Directed   bool `json:"directed"`
	Multigraph bool `json:"multigraph"`
	Compound   bool `json:"compound"`
}

// Graph is graph that when marshaled to JSON can be imported via Graphlib JS pkg from NPM
type Graph struct {
	Nodes   []Node  `json:"nodes"`
	Edges   []Edge  `json:"edges"`
	Options Options `json:"options"`
}

// ToDOT return graph as GraphViz .dot format string
func (g Graph) ToDOT() string {
	dot := "digraph {\n"

	id := 0
	nodeIDs := map[string]int{}

	for _, n := range g.Nodes {
		nodeIDs[n.Name] = id
		dot += fmt.Sprintf("\t%d [label=\"%s\"]\n", id, n.Name)
		id++
	}

	dot += "\n"

	for _, e := range g.Edges {
		dot += fmt.Sprintf("\t%d -> %d;\n", nodeIDs[e.From], nodeIDs[e.To])
	}
	dot += "}\n"

	return dot
}

// SortedNodeNames returns a sorted list of all the node names
func (g Graph) SortedNodeNames() []string {
	names := []string{}

	for _, n := range g.Nodes {
		names = append(names, n.Name)
	}

	sort.Strings(names)
	return names
}
