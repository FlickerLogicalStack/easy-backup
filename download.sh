#!/bin/bash
set -e

TARGET=""

if [[ "$(uname)" == "Linux" ]]; then
    if [[ "$(uname -m)" == "x86_64" ]]; then
        TARGET="linux-x64-modern"
    elif [[ "$(uname -m)" == "aarch64" ]] || [[ "$(uname -m)" == "arm64" ]]; then
        TARGET="linux-arm64"
    fi
elif [[ "$(uname)" == "Darwin" ]]; then
    if [[ "$(uname -m)" == "x86_64" ]]; then
        TARGET="darwin-x64-modern"
    elif [[ "$(uname -m)" == "arm64" ]]; then
        TARGET="darwin-arm64"
    fi
fi

if [[ -z "$TARGET" ]]; then
    echo "Error: Unsupported platform: $(uname) $(uname -m)"
    exit 1
fi

echo "Detected platform: $TARGET"

echo "Fetching latest release..."
VERSION=$(curl -s https://api.github.com/repos/FlickerLogicalStack/easy-backup/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [[ -z "$VERSION" ]]; then
    echo "Error: Failed to fetch latest version"
    exit 1
fi

echo "Latest version: $VERSION"

BASE_URL="https://github.com/FlickerLogicalStack/easy-backup/releases/download/$VERSION"

for BINARY in server client; do
    FILE="easy-backup-$BINARY-$TARGET-$VERSION.tar.gz"
    URL="$BASE_URL/$FILE"

    echo "Downloading $FILE..."
    curl -fsSL -o "$FILE" "$URL"

    echo "Extracting..."
    tar -xzf "$FILE"

    if [[ -d "./bin" ]] && ls ./bin/easy-backup-* 1>/dev/null 2>&1; then
        mv ./bin/easy-backup-* .
        rm -rf ./bin
    fi

    rm -f "$FILE"
done

chmod +x easy-backup-server-* easy-backup-client-* 2>/dev/null

echo ""
echo "Downloading complete! Binaries are in the current directory:"
ls -lh easy-backup-server-* easy-backup-client-* 2>/dev/null
