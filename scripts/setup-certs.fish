#!/usr/bin/env fish

# Check if mkcert is installed
if not command -v mkcert &> /dev/null
    echo "❌ mkcert is not installed"
    echo ""
    echo "Please install mkcert first:"
    echo "  macOS:   brew install mkcert"
    echo "  Linux:   See https://github.com/FiloSottile/mkcert#installation"
    echo ""
    exit 1
end

echo "✓ mkcert is installed"

# Create certs directory if it doesn't exist
mkdir -p .certs

# Install local CA if not already installed
echo "Installing local CA..."
mkcert -install

# Generate certificates for localhost
echo "Generating certificates for localhost..."
cd .certs
mkcert localhost 127.0.0.1 ::1

# Rename files to consistent names
mv localhost+2.pem cert.pem
mv localhost+2-key.pem key.pem

echo ""
echo "✅ Certificates generated successfully!"
echo ""
echo "📁 Certificate files:"
echo "   .certs/cert.pem"
echo "   .certs/key.pem"
echo ""
echo "🚀 Run 'yarn dev' to start the server with HTTPS"
