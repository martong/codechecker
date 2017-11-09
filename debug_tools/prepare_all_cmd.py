#!/usr/bin/env python3
import argparse
import os
import subprocess


def execute(cmd):
    print("Executing command: " + ' '.join(cmd))
    try:
        proc = subprocess.Popen(cmd,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                                )
        out, err = proc.communicate()

        print("stdout:\n\n" + out.decode("utf-8"))
        print("stderr:\n\n" + err.decode("utf-8"))

        if proc.returncode != 0:
            print('Unsuccessful run: "' + ' '.join(cmd) + '"')
            raise Exception("Unsuccessful run of command.")
        return out
    except OSError:
        print('Failed to run: "' + ' '.join(cmd) + '"')
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Prepare all commands '
        'to execute in local environmennt for debugging.')
    parser.add_argument('--clang', required=True)
    parser.add_argument('--libericsson', required=True)
    args = parser.parse_args()

    if (("reports/failed" not in str(os.getcwd())) or
            (str(os.path.basename(os.path.normpath(os.getcwd()))) !=
             "failed")):
        print("Please cd to .../reports/failed")
        exit(-1)

    tools_dir = os.path.dirname(os.path.realpath(__file__))

    out = execute([os.path.join(tools_dir, "prepare_compile_cmd.py"),
                   "../compile_cmd.json"])
    compile_cmd_debug = "compile_cmd_DEBUG.json"
    with open(compile_cmd_debug, 'wb') as f:
        f.write(out)

    out = execute([os.path.join(tools_dir, "prepare_compiler_includes.py"),
                   "../compiler_includes.json"])
    compiler_includes_debug = "compiler_includes_DEBUG.json"
    with open(compiler_includes_debug, 'wb') as f:
        f.write(out)

    out = execute([os.path.join(tools_dir, "prepare_compiler_target.py"),
                   "../compiler_target.json"])
    compiler_target_debug = "compiler_target_DEBUG.json"
    with open(compiler_target_debug, 'wb') as f:
        f.write(out)

    # ctu-collect
    out = execute(["CodeChecker", "analyze", "--ctu-collect",
                   compile_cmd_debug,
                   "--compiler-includes-file", compiler_includes_debug,
                   "--compiler-target-file", compiler_target_debug,
                   "-o", "report_debug",
                   "--verbose", "debug"])

    out = execute([os.path.join(tools_dir, "prepare_analyzer_cmd.py"),
                   "--clang", args.clang,
                   "--libericsson", args.libericsson,
                   "--ctu_dir", "./report_debug/ctu-dir/x86_64",
                   "./analyzer-command"])
    analyzer_command_debug = "analyzer-command_DEBUG"
    with open(analyzer_command_debug, 'wb') as f:
        f.write(out)

    print(
        "Preparation of files for debugging is done. "
        "Now you can execute the generated analyzer command. "
        "E.g. $ bash % s" %
        analyzer_command_debug)
