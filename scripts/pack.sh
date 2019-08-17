for target in windows-x64-10.16.0 linux-x64-10.16.0 linux-x86-10.16.0; do
    nexe bundled/index.js -t $target -o build/$target
done 
