VERSION=$(cat ./package.json | jq .version -r);

SERVER_PATH=./server/server.ts;
CLIENT_PATH=./client/client.ts;

POSSIBLE_TARGETS=(
  # Linux x64
    "linux-x64"
    "linux-x64-baseline"
    "linux-x64-modern"
    "linux-x64-musl-baseline"
    "linux-x64-musl-modern"
  # Linux ARM64
    "linux-arm64"
    "linux-arm64-musl"
  # Windows x64
    "windows-x64"
    "windows-x64-baseline"
    "windows-x64-modern"
  # macOS x64
    "darwin-x64"
    "darwin-x64-baseline"
    "darwin-x64-modern"
  # macOS arm64
    "darwin-arm64"
)

TARGETS=("$@")

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo ${POSSIBLE_TARGETS[@]}
  exit 0
fi

echo "[INFO]" Version: $VERSION;
echo "[INFO]" Targets: ${TARGETS[@]};

build_server() {
  target=$1
  name="easy-backup-server-$target-$VERSION";

  echo "[BUILD]" $name;

  bun build --production --compile --target=bun-$target $SERVER_PATH --outfile ./bin/$name
}

build_client() {
  target=$1
  name="easy-backup-client-$target-$VERSION";

  echo "[BUILD]" $name;

  bun build --production --compile --target=bun-$target $CLIENT_PATH --outfile ./bin/$name
}

for target in "${TARGETS[@]}"
do
  build_server $target
  build_client $target
done
