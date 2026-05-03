#!/bin/bash
# ============================================================
# TaskFlow - update-secrets.sh
# Encode your actual production values and update the K8s
# secret manifest before deploying.
#
# Usage: ./scripts/update-secrets.sh
# ============================================================

echo "========================================"
echo " TaskFlow - Update Kubernetes Secrets"
echo "========================================"
echo ""
echo "Enter your production values below."
echo "They will be base64-encoded and written to k8s/configmap-secret.yaml"
echo ""

read -rp "DB Password        : " DB_PASSWORD
read -rp "JWT Secret Key     : " JWT_SECRET
read -rp "PostgreSQL User    : " POSTGRES_USER
read -rp "PostgreSQL DB name : " POSTGRES_DB

# Encode values
DB_PASS_B64=$(echo -n "$DB_PASSWORD" | base64)
JWT_SECRET_B64=$(echo -n "$JWT_SECRET" | base64)
PG_USER_B64=$(echo -n "$POSTGRES_USER" | base64)
PG_DB_B64=$(echo -n "$POSTGRES_DB" | base64)

# Write new secret file
cat > k8s/configmap-secret.yaml << EOF
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: taskflow-config
  namespace: taskflow
data:
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "${POSTGRES_DB}"
  DB_USER: "${POSTGRES_USER}"
  AUTH_SERVICE_URL: "http://auth-service:3001"
  JWT_EXPIRES_IN: "7d"

---
apiVersion: v1
kind: Secret
metadata:
  name: taskflow-secrets
  namespace: taskflow
type: Opaque
data:
  DB_PASSWORD: ${DB_PASS_B64}
  JWT_SECRET: ${JWT_SECRET_B64}
  POSTGRES_USER: ${PG_USER_B64}
  POSTGRES_DB: ${PG_DB_B64}
EOF

echo ""
echo "[OK] k8s/configmap-secret.yaml updated with your encoded values."
echo "     Do NOT commit this file to Git!"
echo ""
echo "To apply: kubectl apply -f k8s/configmap-secret.yaml"
