#!/bin/sh
# Sync script, just waits till the node running on localhost is synced

starttime=$(date +%s)
synced=0

while test $synced != 1
    do
    tail output.log # the node must redirect its output to output.log
    currtime=$(date +%s)
    difftime=`expr $currtime - $starttime`
    echo "still not synced after $difftime seconds..."
    if [ $difftime -gt 18000 ] ; then exit 1 ; fi # exit with error after 5 hours
    sleep 6
    synced=$(curl http://127.0.0.1:4003/api/v2/node/status -m 2 | grep "\"synced\":true" | wc -l)
done