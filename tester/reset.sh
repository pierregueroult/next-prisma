#!/bin/bash

SCRIPT_NAME=$(basename "$0")

for file in * .*; do
  if [[ "$file" == "$SCRIPT_NAME" || "$file" == ".gitignore" || "$file" == "." || "$file" == ".." ]]; then
    continue
  fi
  rm -rf "$file"
done