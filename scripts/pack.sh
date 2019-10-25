for target in windows-x64 linux-x64 linux-x86; do
    nexe bundled/index.js -t $target-10.16.0 -o build/cogni-$target
done
