#!/bin/bash
set -e

OUTPUT_DIR="${OUTPUT_DIR:-/output}"
KEYSTORE_PASS="${KEYSTORE_PASS:-msm_dev_keystore_pass_2026}"
KEY_ALIAS="${KEY_ALIAS:-myschoolmyparents}"
VALIDITY_DAYS="${VALIDITY_DAYS:-3650}"

mkdir -p "$OUTPUT_DIR"

echo "=========================================================="
echo " [MySchoolMyParents] Generador de certificados de DEV móvil"
echo "=========================================================="
echo "Directorio de destino: $OUTPUT_DIR"

# 1. Keystore de desarrollo Android (RSA 2048)
KEYSTORE_PATH="$OUTPUT_DIR/release.keystore"
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "--> Generando release.keystore de desarrollo..."
  keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY_DAYS" \
    -storepass "$KEYSTORE_PASS" \
    -keypass "$KEYSTORE_PASS" \
    -dname "CN=MySchoolDev, OU=Development, O=MySchoolMyParents, L=DevCity, ST=DevState, C=ES"
  echo "    [OK] release.keystore creado exitosamente."
else
  echo "    [INFO] release.keystore ya existe en $KEYSTORE_PATH (omitido)."
fi

# 2. Generar signing.json para scripts de build móvil
SIGNING_JSON="$OUTPUT_DIR/signing.json"
cat <<EOF > "$SIGNING_JSON"
{
  "alias": "$KEY_ALIAS",
  "password": "$KEYSTORE_PASS"
}
EOF
echo "    [OK] signing.json generado."

# 3. Certificados TLS autofirmados para pruebas HTTPS de emuladores y dispositivos móviles
TLS_KEY="$OUTPUT_DIR/dev-mobile-server.key"
TLS_CRT="$OUTPUT_DIR/dev-mobile-server.crt"
TLS_CSR="$OUTPUT_DIR/dev-mobile-server.csr"
SAN_CONF="$OUTPUT_DIR/san.cnf"

if [ ! -f "$TLS_CRT" ]; then
  echo "--> Generando certificados TLS para desarrollo móvil local..."
  cat <<EOF > "$SAN_CONF"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = ES
ST = Dev
L = Dev
O = MySchoolMyParents Dev
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.local
DNS.3 = 10.0.2.2
IP.1 = 127.0.0.1
IP.2 = 10.0.2.2
EOF

  openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes \
    -keyout "$TLS_KEY" \
    -days "$VALIDITY_DAYS" \
    -out "$TLS_CRT" \
    -config "$SAN_CONF"

  rm -f "$SAN_CONF"
  echo "    [OK] Certificado TLS ($TLS_CRT) y clave ($TLS_KEY) creados con SAN para localhost y emuladores (10.0.2.2)."
else
  echo "    [INFO] Certificado TLS ya existe en $TLS_CRT (omitido)."
fi

echo "=========================================================="
echo " Certificados de desarrollo móvil listos en $OUTPUT_DIR"
echo "=========================================================="
ls -la "$OUTPUT_DIR"
