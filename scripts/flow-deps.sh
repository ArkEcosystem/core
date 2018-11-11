for dir in `ls ./packages`; do
  cd "./packages/$dir"
  yarn flow:deps
  cd ../..
done
