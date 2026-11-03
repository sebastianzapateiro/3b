#!/usr/bin/env bash
# Prepara el VPS para el despliegue continuo (una sola vez). Se corre desde la raíz del repo, en tu PC:
#   bash infra/vps/instalar-despliegue.sh <llave-publica.pub>
#
# - Copia infra/vps/desplegar.sh a /opt/lastresb/desplegar.sh (root, 700).
# - Crea el usuario de sistema `despliegue`. Su llave SOLO ejecuta ese script (command=..., restrict: sin consola,
#   sin túneles) y sudo solo le permite ese archivo. Si la llave se filtra, lo único posible es desplegar `main`.
# Volver a correrlo actualiza el script y reemplaza la llave.
set -euo pipefail

PUB="${1:?Uso: bash infra/vps/instalar-despliegue.sh <llave-publica.pub>}"
grep -q '^ssh-ed25519 ' "$PUB" || { echo "No parece una llave pública ed25519: $PUB" >&2; exit 1; }
LLAVE=$(cat "$PUB")

# Primero a un archivo temporal: con la conexión compartida (ControlMaster), /dev/stdin no siempre se puede abrir.
ssh lastresb-root 'umask 077 && cat > /opt/lastresb/desplegar.sh.nuevo && install -m 700 -o root -g root /opt/lastresb/desplegar.sh.nuevo /opt/lastresb/desplegar.sh && rm /opt/lastresb/desplegar.sh.nuevo' < infra/vps/desplegar.sh

# ssh une los argumentos con espacios y el servidor los vuelve a separar: la llave va citada con %q.
ssh lastresb-root bash -s -- "$(printf '%q' "$LLAVE")" <<'REMOTO'
set -euo pipefail
LLAVE="$1"
id despliegue >/dev/null 2>&1 || useradd --system --create-home --shell /bin/sh despliegue
echo 'despliegue ALL=(root) NOPASSWD: /opt/lastresb/desplegar.sh *' > /etc/sudoers.d/lastresb-despliegue
chmod 440 /etc/sudoers.d/lastresb-despliegue
visudo -cf /etc/sudoers.d/lastresb-despliegue
install -d -m 700 -o despliegue -g despliegue /home/despliegue/.ssh
printf 'command="sudo /opt/lastresb/desplegar.sh \\"$SSH_ORIGINAL_COMMAND\\"",restrict %s\n' "$LLAVE" > /home/despliegue/.ssh/authorized_keys
chown despliegue:despliegue /home/despliegue/.ssh/authorized_keys
chmod 600 /home/despliegue/.ssh/authorized_keys
grep -q "restrict ssh-ed25519 AAAA" /home/despliegue/.ssh/authorized_keys || { echo "La llave no quedó completa." >&2; exit 1; }
echo "Listo: usuario despliegue con llave restringida."
REMOTO
