# pysrc

This is the Python part of the snyk-python-plugin.

Given a fully installed Python package with its dependencies (using a virtual environment),
it analyzes and returns the dependency tree.

The entry point is `main` in `pip_resolve.py`.

## Implementation outline

1. take pkg_resources.working_set (a list of all packages available in the current environment)
2. convert it to a tree
3. parse the manifest (requirements.txt/Pipfile) to find the top-level deps
4. select the parts of the tree that start from TLDs found in previous step
5. determine actual installed versions for the packages in the tree
6. convert that tree in DepTree format

The parts 1 and 5 require access to the Python environment and thus have to be implemented in Python.
The part 3, for requirements.txt, leverages the existing parsing library (pip).
