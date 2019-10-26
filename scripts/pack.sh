version="$(
	grep version package.json |
	sed 's/\s*\"version\":\s*\"\(.*\)\"\s*,\s*/\1/'
)"
for target in windows-x64 windows-x86 linux-x64 linux-x86 macos-x64 macos-x86; do
    nexe bundled/index.js -t $target-10.16.0 -o build/cogni-$version-$target
done
