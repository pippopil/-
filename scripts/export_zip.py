#!/usr/bin/env python3
import os
import sys
import zipfile

def create_project_zip(output_path):
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    exclude_dirs = {
        'node_modules',
        'dist',
        '.git',
        '.cache',
        '.vite',
        '.turbo',
        'android',
        'ios'
    }
    exclude_files = {
        '.env',
        'mastervarka-source.zip'
    }

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
            for file in files:
                if file in exclude_files or file.endswith('.pyc') or file.endswith('.log'):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                zf.write(full_path, rel_path)

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/tmp/mastervarka-source.zip'
    create_project_zip(out)
    print(f"Created {out} ({os.path.getsize(out)} bytes)")
