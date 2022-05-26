#!/bin/bash

rm -rf node_modules
mv package-lock.json{,.bak}
mv package.json{,.bak}
cp package{-dev,}.json
npm install
rm -f package-lock.json package.json
mv package-lock.json{.bak,}
mv package.json{.bak,}
