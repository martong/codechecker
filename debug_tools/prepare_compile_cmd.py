#!/usr/bin/env python3
import argparse
import json
import os

import failure_lib as lib


def existsInSourcesRoot(entry, sources_root):
    """ Returns true if the given file in the compile commands really available
    in the sources-root dir """
    real_path = os.path.join(sources_root, entry['directory'].lstrip('/'),
                             entry['file'])
    return os.path.exists(real_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare compile command json '
                                     'to execute in local environmennt.')
    parser.add_argument('compile_command_json')
    parser.add_argument('--sources_root', default='./sources-root')
    args = parser.parse_args()

    json_data = None
    with open(args.compile_command_json) as data_file:
        json_data = json.load(data_file)

    result_json = []
    for entry in json_data:
        if existsInSourcesRoot(entry, args.sources_root):
            for i in ('directory', 'command'):
                entry[i] =\
                    lib.changePaths(entry[i],
                                    lib.IncludePathModifier(args.sources_root))
            result_json.append(entry)
    print(json.dumps(result_json, indent=4))
