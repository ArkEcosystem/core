# run with:
# cd pysrc; python3 test_pip_resolve.py; cd ..

from pip_resolve import satisfies_python_requirement, \
                        matches_python_version, \
                        matches_environment
from collections import namedtuple

import unittest

try:
    from mock import patch
except:
    from unittest.mock import patch

class TestStringMethods(unittest.TestCase):

    def test_satisfies_python_requirement(self):

        with patch('pip_resolve.sys') as mock_sys:
            mock_sys.version_info = (2, 5)
            self.assertTrue(satisfies_python_requirement('>', '2.4'))

            mock_sys.version_info = (2, 3)
            self.assertTrue(satisfies_python_requirement('==', '2.3'))
            self.assertTrue(satisfies_python_requirement('<=', '2.3'))
            self.assertFalse(satisfies_python_requirement('<', '2.3'))

            mock_sys.version_info = (3, 5)
            self.assertTrue(satisfies_python_requirement('>', '3.1'))

            mock_sys.version_info = (2, 8)
            self.assertFalse(satisfies_python_requirement('>', '3.1'))

            mock_sys.version_info = (2, 6)
            self.assertTrue(satisfies_python_requirement('==', '2.*'))

            mock_sys.version_info = (3, 6)
            self.assertTrue(satisfies_python_requirement('==', '3.*'))


    def test_matches_python_version(self):

        req = namedtuple('requirement', ['line'])

        with patch('pip_resolve.sys') as mock_sys:

            mock_sys.version_info = (2, 5)
            req.line = "futures==3.2.0; python_version == '2.6'"
            self.assertFalse(matches_python_version(req))

            mock_sys.version_info = (2, 6)
            req.line = "futures==3.2.0; python_version == '2.6'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 5)
            req.line = "futures==3.2.0; python_version <= '2.6'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 5)
            req.line = 'futures==3.2.0; python_version <= "2.6"'
            self.assertTrue(matches_python_version(req))

            # BUG: python_version is always expected on the left side
            # mock_sys.version_info = (2, 5)
            # req.line = 'futures==3.2.0; "2.6" >= python_version'
            # self.assertTrue(matches_python_version(req))

            # BUG: Double quotes are supported but allow illegal statements
            mock_sys.version_info = (2, 5)
            req.line = '''futures==3.2.0; python_version <= '2.6"'''
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 6)
            req.line = "futures==3.2.0; python_version == '2.6' or python_version == '2.7'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 7)
            req.line = "futures==3.2.0 ; python_version == '2.6' or python_version == '2.7'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 7)
            req.line = "futures==3.2.0 ; python_version == '2.5' or python_version == '2.6'" \
                " or python_version == '2.7'"
            self.assertTrue(matches_python_version(req))

            # BUG: Comments are not supported
            #mock_sys.version_info = (2, 7)
            #req.line = "futures==3.2.0 ; python_version == '2.6' # or python_version == '2.7'"
            #self.assertFalse(matches_python_version(req))

            # BUG: The 'and' case doesn't really make sesne but should be handled correctly
            mock_sys.version_info = (2, 7)
            req.line = "futures==3.2.0 ; python_version == '2.6' and python_version == '2.7'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 6)
            req.line = "futures==3.2.0; python_version == '2.6' and sys_platform == 'linux2'"
            self.assertTrue(matches_python_version(req))

            mock_sys.version_info = (2, 7)
            req.line = "futures==3.2.0; python_version == '2.6' and sys_platform == 'linux2'"
            self.assertFalse(matches_python_version(req))


    def test_matches_environment(self):

        req = namedtuple('requirement', ['line'])

        with patch('pip_resolve.sys') as mock_sys:

            mock_sys.platform = "LInux2"
            req.line = "futures==3.2.0; sys_platform == 'linux2'"
            self.assertTrue(matches_environment(req))

            # BUG: sys_platform is always expected on the left side
            # mock_sys.platform = "win2000"
            # req.line = "futures==3.2.0; 'linux2' == sys_platform"
            # self.assertFalse(matches_environment(req))

            mock_sys.platform = "linux2"
            req.line = 'futures==3.2.0; sys_platform == "linux2"'
            self.assertTrue(matches_environment(req))

            mock_sys.platform = "win2000"
            req.line = "futures==3.2.0; sys_platform == 'linux2'"
            self.assertFalse    (matches_environment(req))

            # BUG: Only == operator is supported in the moment
            # mock_sys.platform = "linux2"
            # req.line = "futures==3.2.0; sys_platform != 'linux2'"
            # self.assertTrue(matches_environment(req))

            # BUG: Expressions containing logical operators are not supported
            # mock_sys.platform = "win2000"
            # req.line = "futures==3.2.0; python_version == '2.6' and sys_platform == 'linux2'"
            # self.assertTrue(matches_environment(req))



if __name__ == '__main__':
    unittest.main()
