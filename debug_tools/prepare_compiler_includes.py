#!/usr/bin/env python3
import argparse
import json
import failure_lib as lib


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare compiler includes '
                                     'json to execute in local environmennt.')
    parser.add_argument('compiler_includes_file')
    parser.add_argument('--sources_root', default='./sources-root')
    args = parser.parse_args()

    json_data = lib.load_compiler_info(args.compiler_includes_file)
    new_json_data = dict()
    for key, value in json_data.items():
        lines = value.split("\n")
        changed_lines = []
        for line in lines:
            changed_lines.append(
                lib.changePaths(line,
                                lib.IncludePathModifier(args.sources_root)))
        # We change the path of the compiler too in prepare_compile_cmd.py
        new_key = lib.changePaths(key,
                                  lib.IncludePathModifier(args.sources_root))
        new_json_data[new_key] = "\n".join(changed_lines)

    print(json.dumps(new_json_data))
