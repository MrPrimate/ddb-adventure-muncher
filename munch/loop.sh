#!/bin/bash
set -e

RESULTS=$(node ./index.js list | cut -d " " -f1)


echo $RESULTS

echo "$RESULTS" | while IFS= read -r line
do
node ./index.js $line
done
