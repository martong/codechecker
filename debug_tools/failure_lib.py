import json


def findPath(string, path_begin):
    """ Find one path in string.
    @return: the pair of the begin and end pos
    """
    path_end = string.find(' ', path_begin)
    if path_end == -1:
        path_end = len(string)
    path = string[path_begin:path_end]
    return (path, path_end)


def changePaths(string, pathModifierFun):
    """ Scan through the string and possibly replace all found paths.
    @return: The modified string
    """
    result = ''
    i = 0
    while (i < len(string)):
        # Everything is a path wich starts with a '/' and there is a whitespace
        # after that
        if string[i] == '/':
            (path, path_end) = findPath(string, i)
            path = pathModifierFun(path)
            # print(path, end='')
            result += path
            i = path_end - 1
        else:
            # print(string[i], end='')
            result += string[i]
        i = i + 1
    return result


class IncludePathModifier:
    def __init__(self, sources_root):
        self.sources_root = sources_root

    def __call__(self, path):
        return ''.join((self.sources_root, path))


def load_compiler_info(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
    return data
