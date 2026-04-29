VERSION=$(cat package.json | jq .version -r);

SERVER_PATH=./server/server.ts;
CLIENT_PATH=./client/client.ts;

NORMAL_TARGETS=(
  "linux-x64-modern"
  "linux-arm64"
  "darwin-x64-modern"
  "darwin-arm64"
)
XDD_TARGETS=(
  "windows-x64-modern"
)

RELEASE_DIR=./bin

for target in "${NORMAL_TARGETS[@]}"
do
  bun build --production --compile --target=bun-$target $SERVER_PATH --outfile $RELEASE_DIR/ebs;
  bun build --production --compile --target=bun-$target $CLIENT_PATH --outfile $RELEASE_DIR/ebc;

  cd $RELEASE_DIR;

  tar czf "ebs-$target.tar.gz" ebs;
  tar czf "ebc-$target.tar.gz" ebc;

  rm ./ebs;
  rm ./ebc;

  cd ..;
done

for target in "${XDD_TARGETS[@]}"
do
  bun build --production --compile --target=bun-$target $SERVER_PATH --outfile $RELEASE_DIR/ebs;
  bun build --production --compile --target=bun-$target $CLIENT_PATH --outfile $RELEASE_DIR/ebc;

  cd $RELEASE_DIR;

  zip -r "ebs-$target.zip" ebs.exe;
  zip -r "ebc-$target.zip" ebc.exe;

  rm ./ebs.exe;
  rm ./ebc.exe;

  cd ..;
done

gh release create $VERSION \
  --title "Patch v$VERSION" \
  --notes "" \
  --latest \
  $RELEASE_DIR/eb*;

rm -rf $RELEASE_DIR;