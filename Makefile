
.PHONY: all
all:

.PHONY: test
test:
	$(MAKE) -C ./test test

.PHONY: pristine
pristine:
	rm -rf out
