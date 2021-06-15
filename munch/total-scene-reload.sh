#!/bin/bash

rm -rf ../content/scene_info/*.json

echo "Regenerating adventures"

# ./loop.sh

DIRS="$1/*/"
for d in $DIRS; do
  echo "Loading Scenes in ${d}"
  ./load-scenes.sh $d
done
