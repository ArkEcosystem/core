
class Package(object):
    """Abstract class for wrappers around objects that pip returns.
    This class needs to be subclassed with implementations for
    `render_as_root` and `render_as_branch` methods.
    """

    def __init__(self, obj):
        self._obj = obj
        self.project_name = obj.project_name
        self.key = obj.key

    def render_as_root(self, frozen):
        return NotImplementedError

    def render_as_branch(self, frozen):
        return NotImplementedError

    def render(self, parent=None, frozen=False):
        if not parent:
            return self.render_as_root(frozen)
        else:
            return self.render_as_branch(frozen)

    def __getattr__(self, key):
        return getattr(self._obj, key)

    def __repr__(self):
        return '<{0}("{1}")>'.format(self.__class__.__name__, self.key)
