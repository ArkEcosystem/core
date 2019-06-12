COREDIR=$1
COPYTO=$2

for files in $COREDIR/*;
  do
  if [[ $files != *"__tests__"* ]]
  then
    cp -r $files $COPYTO
  fi
done