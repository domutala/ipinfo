#!/bin/bash

cd "$(dirname "$0")"

sudo rm -r node_modules
sudo rm -r bun.lock

set -e

bun pm cache rm
bun install

# Définir le répertoire du projet
PROJECT_DIR="$(pwd)"
SERVICE_NAME="sya.ipinfo.collect.service"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME"

# Créer le fichier de service systemd
echo "Création du fichier de service systemd..."

sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=ipinfo
After=network.target

[Service]
WorkingDirectory=$PROJECT_DIR
ExecStart=sudo env 'PATH=$PATH' bun run src/collect.ts
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

# Recharger systemd pour prendre en compte le nouveau service
echo "Rechargement de systemd..."
sudo systemctl daemon-reload

# # Démarrer le service
echo "Démarrage du service..."
sudo systemctl restart $SERVICE_NAME

# Activer le service pour qu'il se lance automatiquement au démarrage
echo "Activation du service au démarrage..."
sudo systemctl enable $SERVICE_NAME
