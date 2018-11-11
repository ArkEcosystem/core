# NOTE: run this from the root directory as "bash scripts/update-deps.sh"
./node_modules/npm-check-updates/bin/ncu -a

for dir in `ls ./packages`; do
  cd "./packages/$dir"
  ../../node_modules/npm-check-updates/bin/ncu -a
  cd ../..
done
