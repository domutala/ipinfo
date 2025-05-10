#!/bin/bash

# echo "$1"

# # Le nombre de conteneurs à lancer
# echo "Lancement du conteneur..."

# # Lancer le conteneur avec --rm pour suppression automatique après l'arrêt
# CONTAINER_ID=$(docker run -d --rm hello-world)

# # Attendre que le conteneur se termine
# # echo "Attente de la fin du conteneur..."
# docker wait $CONTAINER_ID

# echo "Conteneur terminé et supprimé."

# L'image Docker à utiliser
IMAGE=ipinfo-enrich-ans

file="$1"
lines=$(grep -vE '^\s*$|^\s*#' "$file" | wc -l)
nInstances=$(((lines + 5000) / 10000))

# Le nombre de conteneurs à lancer
NUM_CONTAINERS=$(((lines + 5000) / 10000))

# Lancer les conteneurs et attendre qu'ils se terminent
for i in $(seq 1 $NUM_CONTAINERS); do
    echo "Lancement du conteneur $i"

    STAR_AT=$((i * 10000))

    UNIQ=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 12)

    #Lancer le conteneur avec --rm
    CONTAINER_ID=$(
        docker run -d --rm \
            --name $i-$NUM_CONTAINERS-$UNIQ \
            --memory="500m" \
            -e START_AT=$STAR_AT -e FILE=$file \
            -v ./.data/.ans_ip_prefix:/temp/enrinch-ans \
            $IMAGE
    )

    # docker run -d --memory="500m" --cpus="1" myimage
    # docker run -d --memory="80m" --cpus="0.25" myimage

    # Attendre que le conteneur se termine
    echo "Attente de la fin du conteneur $i..."
    docker wait $CONTAINER_ID

    echo "Conteneur $i terminé et supprimé."
done

# Exécution du prune pour nettoyer les ressources Docker inutilisées
echo "Nettoyage des ressources Docker inutilisées..."
# docker system prune -f --volumes

echo "Tous les conteneurs ont été exécutés et supprimés."
