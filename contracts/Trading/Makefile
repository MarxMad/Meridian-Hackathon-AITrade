# Ejecuta build por defecto
default: build

# Alias para test
all: test

# Test
test: build
	cargo test

# Build del contrato
build:
	stellar contract build

# Deploy del contrato engagement
#* feat/develop_v22
deploy: build
	stellar contract deploy \
		--wasm /Users/gerryp/Meridian-Hack/soroban-meridian-hack/target/wasm32v1-none/release/trading_contract.wasm\
		--source Meridian \
		--network testnet \
		--alias trading-contract 

#* Version de develop
# deploy: build
# 	stellar contract deploy \
# 		--wasm target/wasm32v1-none/release/escrow.wasm \
# 		--source zkCaleb \
# 		--network testnet \
# 		--alias engagement 

# Formatea el código
fmt:
	cargo fmt --all

# Limpia el proyecto
clean:
	cargo clean
