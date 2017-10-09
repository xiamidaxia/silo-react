BIN=node_modules/.bin

TEST_TARGET= --testPathPattern .*\.spec\.js

build: clean
	$(BIN)/babel src  --ignore __tests__ --out-dir lib

clean:
	rm -rf lib/*

test:
	NODE_ENV=test $(BIN)/jest $(TEST_TARGET)

test-watch:
	NODE_ENV=test $(BIN)/jest --watch $(TEST_TARGET)

test-cover:
	NODE_ENV=test $(BIN)/jest --coverage $(TEST_TARGET)

lint:
	$(BIN)/eslint --ext .js,.jsx .


PHONY: build clean test test-watch test-cover lint
