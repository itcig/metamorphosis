#!/bin/bash
HOSTNAME=127.0.0.1
PORT=3392
PATH=/test
NUM_REQUESTS=10

URL=http://${HOSTNAME}:${PORT}${PATH}

for ((i=1;i<=$NUM_REQUESTS;i++)); do  
RESPONSE_CODE=$(/usr/bin/curl \
  -s \
  --write-out %{http_code} \
  -o /dev/null \
  -H "Connection: keep-alive" \
  -H "Content-Type: application/json" \
  -d '{"testkey":"testvalue","iterator":"${i}"}' \
  $URL);
ITERATOR=$(printf "%05d" $i)
DATE=$(/bin/date +"%c%z")
echo $ITERATOR [$(/bin/date +"%c%z")] "\"POST ${PATH} HTTP/1.1\"" ${RESPONSE_CODE} $URL
done