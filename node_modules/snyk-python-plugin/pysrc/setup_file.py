import distutils.core
import re
import setuptools

def parse(setup_py_content):
    """Parse a setup.py file and extract the arguments passed to the setup method"""
    # Make the setup method return the arguments that are passed to it
    def _save_passed_args(**kwargs):
        return kwargs

    distutils.core.setup = _save_passed_args
    setuptools.setup = _save_passed_args
    setup_py_content = setup_py_content.replace("setup(", "passed_arguments = setup(")

    # Fetch the arguments that were passed to the setup.py
    exec(setup_py_content, globals())
    return globals()["passed_arguments"]


def parse_name_and_version(setup_py_content):
    """Extract the name and version from a setup.py file"""
    passed_arguments = parse(setup_py_content)
    return passed_arguments.get("name"), passed_arguments.get("version")


def get_provenance(setup_py_content):
    """Provenance for a setup.py file is the index of the line that contains `install_requires`"""
    for index, line in enumerate(setup_py_content.splitlines()):
        if re.search(r"(packages|install_requires)\s*=", line):
            return index + 1
    return -1


def parse_requirements(setup_py_content):
    """Extract the dependencies from a setup.py file"""
    passed_arguments = parse(setup_py_content)
    requirements = passed_arguments.get("install_requires", passed_arguments.get("packages", []))
    return "\n".join(requirements)
