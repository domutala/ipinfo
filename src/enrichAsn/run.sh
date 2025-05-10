rm -f .logs/.routeviews
mkdir -p .data/.routeviews
split -n 10 .data/routeviews.txt .data/.routeviews/part_

docker build -f src/enrichAsn/docker/Dockerfile -t ipinfo-enrich-ans .

# ls .data/.routeviews/part_* | xargs -n 1 -P 10 bash src/enrichAsn/launch.sh

parallel --no-notice -j 10 bash src/enrichAsn/launch.sh {} ::: .data/.routeviews/part_*
