#!/bin/bash
set -e && \
cd ./dist && \
remote_repo=${GITHUB_TOKEN_URL:-`git config remote.origin.url`} && \
remote_branch="gh-pages" && \
git init && \
git add . && \
git commit -m'build' && \
git push --force --quiet $remote_repo master:$remote_branch > /dev/null 2>&1 && \
rm -fr .git && \
cd ../