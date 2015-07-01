# https://www.rabbitmq.com/ssl.html

# RABBITMQ_SERVER_START_ARGS="-rabbit ssl_listeners [5671] -rabbit ssl_options[{cacertfile,\"test/ssl/testca/cacert.pem\"},{certfile,\"test/ssl/server/cert.pem\"},{keyfile,\"test/ssl/server/key.pem\"},{verify,verify_peer},{fail_if_no_peer_cert,false}]" rabbitmq-server
RABBITMQ_SERVER_START_ARGS="-rabbit ssl_listeners [5671] -rabbit ssl_options [{cacertfile,\"test/ssl/testca/cacert.pem\"},{certfile,\"test/ssl/server/cert.pem\"},{keyfile,\"test/ssl/server/key.pem\"},{verify,verify_peer},{fail_if_no_peer_cert,false}]" rabbitmq-server

mkdir testca
cd testca

mkdir certs private
chmod 700 private
echo 01 > serial
touch index.txt
pwd
openssl req -x509 -config ../openssl.cnf -newkey rsa:2048 -days 365 \
    -out cacert.pem -outform PEM -subj /CN=MyTestCA/ -nodes

openssl x509 -in cacert.pem -out cacert.cer -outform DER

cd ..

mkdir server
cd server
openssl genrsa -out key.pem 2048
openssl req -new -key key.pem -out req.pem -outform PEM \
  -subj /CN=localhost/O=server/ -nodes
cd ../testca
pwd
openssl ca -config ../openssl.cnf -in ../server/req.pem -out \
  ../server/cert.pem -notext -batch -extensions server_ca_extensions
cd ../server
openssl pkcs12 -export -out keycert.p12 -in cert.pem -inkey key.pem -passout pass:

cd ..

mkdir client
cd client
openssl genrsa -out key.pem 2048
openssl req -new -key key.pem -out req.pem -outform PEM \
  -subj /CN=localhost/O=client/ -nodes
cd ../testca
pwd
openssl ca -config ../openssl.cnf -in ../client/req.pem -out \
  ../client/cert.pem -notext -batch -extensions client_ca_extensions
cd ../client
openssl pkcs12 -export -out keycert.p12 -in cert.pem -inkey key.pem -passout pass:
