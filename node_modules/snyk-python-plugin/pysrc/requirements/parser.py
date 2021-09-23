# MODIFIED - Replace/Update with care

import os
import warnings
import re

from .requirement import Requirement

def parse(req_str_or_file):
    """
    Parse a requirements file into a list of Requirements

    See: pip/req.py:parse_requirements() and
    https://pip.pypa.io/en/stable/reference/pip_install/#requirements-file-format

    :param req_str_or_file: a string or file like object containing requirements
    :returns: a *generator* of Requirement objects
    """
    filename = getattr(req_str_or_file, 'name', None)
    reqstr = req_str_or_file
    try:
        # Python 2.x compatibility
        if not isinstance(req_str_or_file, basestring):
            reqstr = req_str_or_file.read()
    except NameError:
        # Python 3.x only
        if not isinstance(req_str_or_file, str):
            reqstr = req_str_or_file.read()

    # To deal with lines broken via a backslash
    initial_zero_based_line_idx = 0
    accumulator_line_parts = []

    for zero_based_line_idx, original_line in enumerate(reqstr.splitlines()):

        if original_line.endswith('\\'):
            accumulator_line_parts.append(original_line.rstrip('\\'))
            continue

        # Construct a full line from pieces broken by backslashes
        accumulator_line_parts.append(original_line)
        original_line_idxs = (initial_zero_based_line_idx, zero_based_line_idx)
        initial_zero_based_line_idx = zero_based_line_idx + 1
        line = ' '.join(accumulator_line_parts)
        accumulator_line_parts = []

        line = line.strip()

        if line == '':
            continue
        elif not line or line.startswith('#'):
            # comments are lines that start with # only
            continue
        elif line.startswith('--trusted-host'):
            # unsupported
            continue
        elif line.startswith('-r') or line.startswith('--requirement'):
            _, new_filename = line.split()
            new_file_path = os.path.join(os.path.dirname(filename or '.'),
                                         new_filename)
            with open(new_file_path) as f:
                for requirement in parse(f):
                    yield requirement
        elif line.startswith('-f') or line.startswith('--find-links') or \
                line.startswith('-i') or line.startswith('--index-url') or \
                line.startswith('--extra-index-url') or \
                line.startswith('--no-index'):
            warnings.warn('Private repos not supported. Skipping.')
            continue
        elif line.startswith('-Z') or line.startswith('--always-unzip'):
            warnings.warn('Unused option --always-unzip. Skipping.')
            continue
        elif line.startswith('-'):
            warnings.warn('Line starts with an option (%s). Skipping.' % \
                line.split()[0])
            continue
        else:
            req = Requirement.parse(line)
            req.provenance = (
                filename,
                original_line_idxs[0] + 1,
                original_line_idxs[1] + 1,
            )
            yield req
