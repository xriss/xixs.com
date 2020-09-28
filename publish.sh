cd `dirname $0`

plated/build
rsync -avh ./docs/ /server/public/xixs.com/ --delete --human-readable

