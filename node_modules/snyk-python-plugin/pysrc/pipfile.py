"""Simplistic parsing of Pipfile dependency files

This only extracts a small subset of the information present in a Pipfile,
as needed for the purposes of this library.
"""
from utils import is_string

import pytoml


class PipfileRequirement(object):
    def __init__(self, name):
        self.name = name

        self.editable = False
        self.vcs = None
        self.vcs_uri = None
        self.version = None
        self.markers = None
        self.provenance = None # a tuple of (file name, line)

    @classmethod
    def from_dict(cls, name, requirement_dict, pos_in_toml):
        req = cls(name)

        req.version = requirement_dict.get('version')
        req.editable = requirement_dict.get('editable', False)
        for vcs in ['git', 'hg', 'svn', 'bzr']:
            if vcs in requirement_dict:
                req.vcs = vcs
                req.vcs_uri = requirement_dict[vcs]
                break
        req.markers = requirement_dict.get('markers')
        # proper file name to be injected into provenance by the calling code
        req.provenance = ('Pipfile', pos_in_toml[0], pos_in_toml[0])

        return req

def val_with_pos(kind, text, value, pos):
    return (value, pos)

def parse(file_contents):
    data = pytoml.loads(file_contents, translate=val_with_pos)

    sections = ['packages', 'dev-packages']
    res = dict.fromkeys(sections)
    for section in sections:
        if section not in data:
            continue

        section_data = data[section]

        res[section] = [
            PipfileRequirement.from_dict(
                name,
                value if not is_string(value) else {'version': value},
                pos,
            )
            for name, (value, pos) in sorted(section_data.items())
        ]

    return res
