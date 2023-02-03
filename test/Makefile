build:
	dotnet build -c Release;
	wasm-opt bin/Release/net7.0/test.wasm -O3 --enable-bulk-memory -o ../src/lol.wasm
	#~/Downloads/wabt-1.0.29/bin/wasm2wat ../src/core.wasm -o ../core.wat;
