#!/bin/bash
set -e

FILES="$1/*.json"

echo "Found files..."
echo "${FILES}"
for f in $FILES
do
  echo "Processing $f file..."
  # take action on each file. $f store current file name
  node ./index.js load $f
done

# split $1 to determine book code
BOOK_CODE=$(basename "$1")
BOOK_CODE="${BOOK_CODE%.*}"

node ./index.js update-meta-book $BOOK_CODE
