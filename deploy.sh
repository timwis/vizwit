cd ./dist && \
remote_repo=`git config remote.origin.url` && \
remote_branch="gh-pages" && \
git init && \
git add . && \
git commit -m'build' && \
git push $remote_repo master:$remote_branch --force && \
rm -fr .git && \
cd ../