cd `dirname $0`

git add .
git commit -m.
git pull
git push

./sync.sh
plated/build
rsync -avh ./docs/ /server/public/xixs.com/ --delete --human-readable

