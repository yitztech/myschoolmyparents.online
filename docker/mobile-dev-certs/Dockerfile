FROM alpine:3.20

# Herramientas necesarias para certificados de desarrollo: OpenJDK (keytool) y OpenSSL
RUN apk add --no-cache \
    openjdk17-jre-headless \
    openssl \
    bash

WORKDIR /certs-generator

COPY generate-certs.sh /certs-generator/generate-certs.sh
RUN chmod +x /certs-generator/generate-certs.sh

ENTRYPOINT ["/certs-generator/generate-certs.sh"]
