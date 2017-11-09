#!/usr/bin/env python3
import argparse
import json
import failure_lib as lib


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare compiler target '
                                     'json to execute in local environmennt.')
    parser.add_argument('compiler_target_file')
    parser.add_argument('--sources_root', default='./sources-root')
    args = parser.parse_args()

    json_data = lib.load_compiler_info(args.compiler_target_file)
    new_json_data = dict()
    for key, value in json_data.items():
        # We change the path of the compiler too in prepare_compile_cmd.py
        new_key = lib.changePaths(key,
                                  lib.IncludePathModifier(args.sources_root))
        new_json_data[new_key] = value

    print(json.dumps(new_json_data))
