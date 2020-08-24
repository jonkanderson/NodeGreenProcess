
SHELL:=/bin/bash

OUT_DIR=../out
DATA_DIR=./regressionData

.PHONY: all
all:

.PHONY: test
test: test01 test02

# Compare the sequences separately.  Also, the beginning output should match. 
.PHONY: test01
test01:
	mkdir -p $(OUT_DIR)
	nodejs test01.js > $(OUT_DIR)/test01-out.txt
	@cat $(DATA_DIR)/test01-out.txt | grep "^AA" > $(OUT_DIR)/test01-AA1.txt
	@cat $(OUT_DIR)/test01-out.txt | grep "^AA" > $(OUT_DIR)/test01-AA2.txt
	diff $(OUT_DIR)/test01-AA1.txt $(OUT_DIR)/test01-AA2.txt
	@if [ "$$?" -eq "0" ]; then \
		echo "PASS: Comparing AA sequence."; \
		else echo "FAIL: Comparing AA sequence."; fi
	@cat $(DATA_DIR)/test01-out.txt | grep "^X" > $(OUT_DIR)/test01-X1.txt
	@cat $(OUT_DIR)/test01-out.txt | grep "^X" > $(OUT_DIR)/test01-X2.txt
	diff $(OUT_DIR)/test01-X1.txt $(OUT_DIR)/test01-X2.txt
	@if [ "$$?" -eq "0" ]; then \
		echo "PASS: Comparing X sequence."; \
		else echo "FAIL: Comparing X sequence."; fi
	@cat $(DATA_DIR)/test01-out.txt | grep "^Y" > $(OUT_DIR)/test01-Y1.txt
	@cat $(OUT_DIR)/test01-out.txt | grep "^Y" > $(OUT_DIR)/test01-Y2.txt
	diff $(OUT_DIR)/test01-Y1.txt $(OUT_DIR)/test01-Y2.txt
	@if [ "$$?" -eq "0" ]; then \
		echo "PASS: Comparing Y sequence."; \
		else echo "FAIL: Comparing Y sequence."; fi
	@cat $(DATA_DIR)/test01-out.txt | head -n 15 > $(OUT_DIR)/test01-H1.txt
	@cat $(OUT_DIR)/test01-out.txt | head -n 15 > $(OUT_DIR)/test01-H2.txt
	diff $(OUT_DIR)/test01-H1.txt $(OUT_DIR)/test01-H2.txt
	@if [ "$$?" -eq "0" ]; then \
		echo "PASS: Comparing heads."; \
		else echo "FAIL: Comparing heads."; fi
	@echo "Comparing for unimportant difference:"
	-diff $(DATA_DIR)/test01-out.txt $(OUT_DIR)/test01-out.txt

.PHONY: test02
test02:
	mkdir -p $(OUT_DIR)
	nodejs test02.js > $(OUT_DIR)/test02-out.txt
	#diff $(DATA_DIR)/test02-out.txt $(OUT_DIR)/test02-out.txt
	cat $(OUT_DIR)/test02-out.txt

.PHONY: testLeaks
testLeaks:
	@echo "# Run the following command:"
	@echo "nodejs testLeaks.js"
	@echo "# Use htop to check for memory usage."
