#!/bin/bash

rm -rf node_modules
mv package-lock.json{,.bak}
npm ci --ignore-scripts
rm -f package.json
mv package-lock.json{.bak,}
