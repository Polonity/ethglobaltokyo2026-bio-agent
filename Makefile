PYTHON ?= python3
.PHONY: dev train test

dev:
	$(PYTHON) -m services.backend

train:
	$(PYTHON) -m packages.training

test:
	$(PYTHON) -m unittest discover -s tests -v

FORGE ?= forge
.PHONY: contracts-build contracts-test contracts-fmt contracts-abi contracts-dry-run sepolia-dry-run

contracts-build:
	cd contracts && $(FORGE) build --sizes

contracts-test:
	cd contracts && $(FORGE) test -vv

contracts-fmt:
	cd contracts && $(FORGE) fmt --check

contracts-abi:
	FORGE=$(FORGE) $(PYTHON) scripts/export-contract-abi.py

# Offline EVM simulation with Sepolia's chain ID; no RPC or private key required.
contracts-dry-run:
	cd contracts && DEPLOYER_ADDRESS=0x000000000000000000000000000000000000bEEF $(FORGE) script script/DeployBioAgentRegistry.s.sol:DeployBioAgentRegistry --chain 11155111

# Read-only RPC-backed simulation; requires contracts/.env. Never broadcasts.
sepolia-dry-run:
	cd contracts && $(FORGE) script script/DeployBioAgentRegistry.s.sol:DeployBioAgentRegistry --rpc-url sepolia

ANVIL ?= anvil
.PHONY: contracts-check-deployment
contracts-check-deployment:
	FORGE=$(FORGE) ANVIL=$(ANVIL) $(PYTHON) scripts/check-deployment.py
