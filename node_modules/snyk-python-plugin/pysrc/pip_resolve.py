import io
import sys
import os
import json
import re
import argparse
import utils
import requirements
import pipfile
import setup_file
from operator import le, lt, gt, ge, eq, ne

try:
    import pkg_resources
except ImportError:
    # try using the version vendored by pip
    try:
        import pip._vendor.pkg_resources as pkg_resources
    except ImportError:
        raise ImportError(
            "Could not import pkg_resources; please install setuptools or pip.")

PYTHON_MARKER_REGEX = re.compile(r'python_version\s*(?P<operator>==|<=|=>|>|<)\s*[\'"](?P<python_version>.+?)[\'"]')
SYSTEM_MARKER_REGEX = re.compile(r'sys_platform\s*==\s*[\'"](.+)[\'"]')

def format_provenance_label(prov_tuple):
    fn, ln1, ln2 = prov_tuple
    if ln1 == ln2:
        return fn + ':' + str(ln1)
    else:
        return fn + ':' + str(ln1) + '-' + str(ln2)

def create_tree_of_packages_dependencies(
        dist_tree,
        top_level_requirements,
        req_file_path,
        allow_missing=False,
        only_provenance=False
    ):
    """Create packages dependencies tree
    :param dict tree: the package tree
    :param set packages_names: set of select packages to be shown in the output.
    :param req_file_path: the path to the dependencies file
                          (e.g. requirements.txt)
    :rtype: dict
    """
    DEPENDENCIES = 'dependencies'
    VERSION = 'version'
    NAME = 'name'
    DIR_VERSION = '0.0.0'
    PACKAGE_FORMAT_VERSION = 'packageFormatVersion'
    LABELS = 'labels'
    PROVENANCE = 'provenance'

    tree = utils.sorted_tree(dist_tree)
    nodes = tree.keys()
    key_tree = dict((k.key, v) for k, v in tree.items())

    lowercase_pkgs_names = [p.name.lower() for p in top_level_requirements]
    tlr_by_key = dict((tlr.name.lower(), tlr) for tlr in top_level_requirements)
    packages_as_dist_obj = [
        p for p in nodes if
            p.key.lower() in lowercase_pkgs_names or
            (p.project_name and p.project_name.lower()) in lowercase_pkgs_names]

    def create_children_recursive(root_package, key_tree, ancestors):
        root_name = root_package[NAME].lower()
        if root_name not in key_tree:
            msg = 'Required packages missing: ' + root_name
            if allow_missing:
                sys.stderr.write(msg + "\n")
                return
            else:
                sys.exit(msg)

        ancestors = ancestors.copy()
        ancestors.add(root_name)
        children_packages_as_dist = key_tree[root_name]
        for child_dist in children_packages_as_dist:
            if child_dist.project_name.lower() in ancestors:
                continue

            child_package = {
                NAME: child_dist.project_name,
                VERSION: child_dist.installed_version,
            }

            create_children_recursive(child_package, key_tree, ancestors)
            if DEPENDENCIES not in root_package:
                root_package[DEPENDENCIES] = {}
            root_package[DEPENDENCIES][child_dist.project_name] = child_package
        return root_package

    def create_dir_as_root():
        name, version = None, None
        if os.path.basename(req_file_path) == 'setup.py':
            with open(req_file_path, "r") as setup_py_file:
                name, version = setup_file.parse_name_and_version(setup_py_file.read())

        dir_as_root = {
            NAME: name or os.path.basename(os.path.dirname(os.path.abspath(req_file_path))),
            VERSION: version or DIR_VERSION,
            DEPENDENCIES: {},
            PACKAGE_FORMAT_VERSION: 'pip:0.0.1'
        }
        return dir_as_root

    def create_package_as_root(package, dir_as_root):
        package_as_root = {
            NAME: package.project_name.lower(),
            # Note: _version is a private field.
            VERSION: package._obj._version,
        }
        return package_as_root
    dir_as_root = create_dir_as_root()
    for package in packages_as_dist_obj:
        package_as_root = create_package_as_root(package, dir_as_root)
        if only_provenance:
            package_as_root[LABELS] = {PROVENANCE: format_provenance_label(tlr_by_key[package_as_root[NAME]].provenance)}
            dir_as_root[DEPENDENCIES][package_as_root[NAME]] = package_as_root
        else:
            package_tree = create_children_recursive(package_as_root, key_tree, set([]))
            dir_as_root[DEPENDENCIES][package_as_root[NAME]] = package_tree
    return dir_as_root

def satisfies_python_requirement(parsed_operator, py_version_str):
    # TODO: use python semver library to compare versions
    operator_func = {
        ">": gt,
        "==": eq,
        "<": lt,
        "<=": le,
        ">=": ge,
        '!=': ne,
    }[parsed_operator]
    system_py_version_tuple = (sys.version_info[0], sys.version_info[1])
    py_version_tuple = tuple(py_version_str.split('.')) # string tuple
    if py_version_tuple[-1] == '*':
        system_py_version_tuple = system_py_version_tuple[0]
        py_version_tuple = int(py_version_tuple[0]) # int tuple
    else:
        py_version_tuple = tuple(int(x) for x in py_version_tuple) # int tuple

    return operator_func(system_py_version_tuple, py_version_tuple)

def get_markers_text(requirement):
    if isinstance(requirement, pipfile.PipfileRequirement):
        return requirement.markers
    return requirement.line

def matches_python_version(requirement):
    """Filter out requirements that should not be installed
    in this Python version.
    See: https://www.python.org/dev/peps/pep-0508/#environment-markers
    """
    markers_text = get_markers_text(requirement)
    if not (markers_text and re.match(".*;.*python_version", markers_text)):
        return True

    cond_text = markers_text.split(";", 1)[1]

    # Gloss over the 'and' case and return true on the first matching python version

    for sub_exp in re.split("\s*(?:and|or)\s*", cond_text):
        match = PYTHON_MARKER_REGEX.search(sub_exp)

        if match:
            match_dict = match.groupdict()

            if len(match_dict) == 2 and satisfies_python_requirement(
                    match_dict['operator'],
                    match_dict['python_version']
                ):
                return True

    return False


def matches_environment(requirement):
    """Filter out requirements that should not be installed
    in this environment. Only sys_platform is inspected right now.
    This should be expanded to include other environment markers.
    See: https://www.python.org/dev/peps/pep-0508/#environment-markers
    """
    sys_platform = sys.platform.lower()
    markers_text = get_markers_text(requirement)
    if markers_text and 'sys_platform' in markers_text:
        match = SYSTEM_MARKER_REGEX.findall(markers_text)
        if len(match) > 0:
            return match[0].lower() == sys_platform
    return True

def is_testable(requirement):
    return requirement.editable == False and requirement.vcs is None

def get_requirements_list(requirements_file_path, dev_deps=False):
    # TODO: refactor recognizing the dependency manager to a single place
    if os.path.basename(requirements_file_path) == 'Pipfile':
        with io.open(requirements_file_path, 'r', encoding='utf-8') as f:
            requirements_data = f.read()
        parsed_reqs = pipfile.parse(requirements_data)
        req_list = list(parsed_reqs.get('packages', []))
        if dev_deps:
            req_list.extend(parsed_reqs.get('dev-packages', []))
        for r in req_list:
            r.provenance = (requirements_file_path, r.provenance[1], r.provenance[2])
    elif os.path.basename(requirements_file_path) == 'setup.py':
        with open(requirements_file_path, 'r') as f:
            setup_py_file_content = f.read()
        requirements_data = setup_file.parse_requirements(setup_py_file_content)
        req_list = list(requirements.parse(requirements_data))

        provenance = setup_file.get_provenance(setup_py_file_content)
        for req in req_list:
            req.provenance = (
                os.path.basename(requirements_file_path),
                provenance,
                provenance
            )
    else:
        # assume this is a requirements.txt formatted file
        # Note: requirements.txt files are unicode and can be in any encoding.
        with open(requirements_file_path, 'r') as f:
            req_list = list(requirements.parse(f))

    req_list = filter(matches_environment, req_list)
    req_list = filter(is_testable, req_list)
    req_list = filter(matches_python_version, req_list)
    req_list = [r for r in req_list if r.name]
    for req in req_list:
        req.name = req.name.lower().replace('_', '-')
    return req_list

def create_dependencies_tree_by_req_file_path(requirements_file_path,
                                              allow_missing=False,
                                              dev_deps=False,
                                              only_provenance=False):
    # get all installed packages
    pkgs = list(pkg_resources.working_set)

    # get all installed packages's distribution object
    dist_index = utils.build_dist_index(pkgs)

    # get all installed distributions tree
    dist_tree = utils.construct_tree(dist_index)

    # create a list of dependencies from the dependencies file
    required = get_requirements_list(requirements_file_path, dev_deps=dev_deps)
    installed = [p for p in dist_index]
    top_level_requirements = []
    missing_package_names = []
    for r in required:
        if r.name not in installed:
            missing_package_names.append(r.name)
        else:
            top_level_requirements.append(r)
    if missing_package_names:
        msg = 'Required packages missing: ' + (', '.join(missing_package_names))
        if allow_missing:
            sys.stderr.write(msg + "\n")
        else:
            sys.exit(msg)

    # build a tree of dependencies
    package_tree = create_tree_of_packages_dependencies(
        dist_tree, top_level_requirements, requirements_file_path, allow_missing, only_provenance)
    print(json.dumps(package_tree))


def main():
    """Builds the dependency tree from the manifest file (Pipfile or requirements.txt) and
    prints it as JSON. The tree nodes are:
    interface DepTree {
        name: string;
        version?: string;
        dependencies?: {[n: string]: DepTree};
        labels: { provenance?: string };
    }
    The `provenance` label only present for the top-level nodes, indicates the position of the dependency
    version in the original file and is in the format "filename:lineNum" or "filename:lineFrom-lineTo",
    where line numbers are 1-based.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("requirements",
        help="dependencies file path (requirements.txt or Pipfile)")
    parser.add_argument("--allow-missing",
        action="store_true",
        help="don't fail if some packages listed in the dependencies file " +
             "are not installed")
    parser.add_argument("--dev-deps",
        action="store_true",
        help="resolve dev dependencies")
    parser.add_argument("--only-provenance",
        action="store_true",
        help="only return top level deps with provenance information")
    args = parser.parse_args()

    create_dependencies_tree_by_req_file_path(
        args.requirements,
        allow_missing=args.allow_missing,
        dev_deps=args.dev_deps,
        only_provenance=args.only_provenance,
    )

if __name__ == '__main__':
    sys.exit(main())
