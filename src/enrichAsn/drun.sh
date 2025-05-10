#!/bin/bash

file=".data/routeviews.txt"
lines=$(grep -vE '^\s*$|^\s*#' "$file" | wc -l)
nInstances=$(((lines + 5000) / 10000))

echo "Total d'instances à exécuter : $nInstances"
batchSize=10

for ((i = 0; i < nInstances; i++)); do
    startAt=$((i * 10000))
    bun run src/enrichAsn/enrich.ts --startAt $startAt

    # echo "▶️ Lancement du batch $((i / batchSize + 1))..."

    # # Lancer un batch de 10 (ou moins si c'est le dernier)
    # for ((j = 0; j < batchSize && i + j < nInstances; j++)); do
    #     startAt=$(((i + j) * 10000))
    #     bun run src/enrichAsn/enrich.ts --startAt $startAt &
    # done

    # wait # Attend que les 10 (ou moins) jobs soient terminés
    # echo "✅ Batch $((i / batchSize + 1)) terminé."
done

# echo "🎉 Tous les batches sont terminés."
