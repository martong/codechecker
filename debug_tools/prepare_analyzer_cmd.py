#!/usr/bin/env python3
import argparse
import re
import failure_lib as lib


def getFirstLineOfFile(fname):
    content = ''
    with open(fname) as f:
        content = f.readlines()
    # this file has one line only
    return content[0]


# This is duplicated from the libcodechecer module
# TODO could we have a common module for both libcodechecker and these debug
# tools?
def parse_compiler_includes(lines):
    '''
    Parse the compiler include paths from a string
    '''
    start_mark = "#include <...> search starts here:"
    end_mark = "End of search list."

    include_paths = []

    do_append = False
    for line in lines.splitlines(True):
        line = line.strip()
        if line.startswith(end_mark):
            break
        if do_append:
            # On OSX there are framework includes,
            # where we need to strip the "(framework directory)" string.
            # For instance:
            # /System/Library/Frameworks (framework directory)
            fpos = line.find("(framework directory)")
            if fpos == -1:
                include_paths.append("-isystem " + line)
            else:
                include_paths.append("-isystem " + line[0:fpos-1])

        if line.startswith(start_mark):
            do_append = True

    return include_paths


class AnalyzerCommandPathModifier:
    def __init__(self, args):
        self.args = args

    def __call__(self, path):
        if re.search('clang$', path):
            return self.args.clang
        elif re.search('libericsson-checkers.*\.so', path):
            return self.args.libericsson
        elif re.search('ctu-dir', path):
            return self.args.ctu_dir
        else:
            return ''.join((self.args.sources_root, path))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare analyzer-command '
                                     'to execute in local environmennt.')
    parser.add_argument('analyzer_command_file')
    parser.add_argument('--sources_root', default='./sources-root')
    parser.add_argument('--clang', required=True)
    parser.add_argument('--libericsson', required=True)
    parser.add_argument('--ctu_dir', required=True)
    args = parser.parse_args()

    res = lib.changePaths(getFirstLineOfFile(args.analyzer_command_file),
                          AnalyzerCommandPathModifier(args))

    print(res)
