#!/bin/bash
FILES="$1/*"

echo "Found files..."
echo "${FILES}"
for f in $FILES
do
  echo "Processing $f file..."
  # take action on each file. $f store current file name
  node ./index.js load $f
done
