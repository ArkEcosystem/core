from importlib import import_module
from operator import attrgetter
try:
    from collections import OrderedDict
except ImportError:
    from ordereddict import OrderedDict
import sys
from reqPackage import ReqPackage
from distPackage import DistPackage
__version__ = '0.10.1'


def build_dist_index(pkgs):
    """Build an index pkgs by their key as a dict.
    :param list pkgs: list of pkg_resources.Distribution instances
    :returns: index of the pkgs by the pkg key
    :rtype: dict
    """
    return dict((p.key, DistPackage(p)) for p in pkgs)


def construct_tree(index):
    """Construct tree representation of the pkgs from the index.
    The keys of the dict representing the tree will be objects of type
    DistPackage and the values will be list of ReqPackage objects.
    :param dict index: dist index ie. index of pkgs by their keys
    :returns: tree of pkgs and their dependencies
    :rtype: dict
    """
    return dict((p, [ReqPackage(r, index.get(r.key))
                     for r in p.requires()])
                for p in index.values())


def sorted_tree(tree):
    """Sorts the dict representation of the tree
    The root packages as well as the intermediate packages are sorted
    in the alphabetical order of the package names.
    :param dict tree: the pkg dependency tree obtained by calling
                     `construct_tree` function
    :returns: sorted tree
    :rtype: collections.OrderedDict
    """
    return OrderedDict(sorted([(k, sorted(v, key=attrgetter('key')))
                               for k, v in tree.items()],
                              key=lambda kv: kv[0].key))


def guess_version(pkg_key, default='?'):
    """Guess the version of a pkg when pip doesn't provide it
    :param str pkg_key: key of the package
    :param str default: default version to return if unable to find
    :returns: version
    :rtype: string
    """
    try:
        m = import_module(pkg_key)
    except ImportError:
        return default
    else:
        return getattr(m, '__version__', default)


def is_string(obj):
    """Check whether an object is a string"""
    if sys.version_info < (3,):
        # Python 2.x only
        return isinstance(obj, basestring)
    else:
        return isinstance(obj, str)
