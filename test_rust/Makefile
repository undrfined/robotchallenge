build:
	cargo build --target wasm32-wasi;
	cp target/wasm32-wasi/debug/test_rust.wasm ../src/test_rust.wasm;
	#~/Downloads/wabt-1.0.29/bin/wasm2wat ../src/core.wasm -o ../core.wat;
