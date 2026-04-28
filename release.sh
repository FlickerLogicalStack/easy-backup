sh ./build.sh \
  linux-x64-modern \
  linux-arm64 \
  darwin-x64-modern \
  darwin-arm64 \
;

for f in ./bin/*; do
  if [ -f "$f" ] && [[ "$f" != *.tar.gz ]]; then
    tar czf "$f.tar.gz" "$f"
  fi
done

new_version=$(cat package.json | jq .version -r);

gh release create $new_version \
  --title "Patch v$new_version" \
  --notes "" \
  --latest \
  bin/*.tar.gz

rm -rf ./bin