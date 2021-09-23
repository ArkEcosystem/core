import pkg_resources
import utils
from package import Package


class ReqPackage(Package):
    """Wrapper class for Requirements instance
      :param obj: The `Requirements` instance to wrap over
      :param dist: optional `pkg_resources.Distribution` instance for
                   this requirement
    """

    UNKNOWN_VERSION = '?'

    def __init__(self, obj, dist=None):
        super(ReqPackage, self).__init__(obj)
        self.dist = dist

    @property
    def version_spec(self):
        specs = self._obj.specs
        return ','.join([''.join(sp) for sp in specs]) if specs else None

    @property
    def installed_version(self):
        if not self.dist:
            return utils.guess_version(self.key, self.UNKNOWN_VERSION)
        return self.dist.version

    def is_conflicting(self):
        """If installed version conflicts with required version"""
        # unknown installed version is also considered conflicting
        if self.installed_version == self.UNKNOWN_VERSION:
            return True
        ver_spec = (self.version_spec if self.version_spec else '')
        req_version_str = '{0}{1}'.format(self.project_name, ver_spec)
        req_obj = pkg_resources.Requirement.parse(req_version_str)
        return self.installed_version not in req_obj

    def as_dict(self):
        return {'key': self.key,
                'package_name': self.project_name,
                'installed_version': self.installed_version,
                'required_version': self.version_spec}
