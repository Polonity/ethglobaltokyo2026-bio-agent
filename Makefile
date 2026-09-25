PYTHON ?= python3
.PHONY: dev train test

dev:
	$(PYTHON) -m services.backend

train:
	$(PYTHON) -m packages.training

test:
	$(PYTHON) -m unittest discover -s tests -v
