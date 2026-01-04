define IS_IN_DOCKER
	test -f /.dockerenv
endef

define CHECK_OUTSIDE_DOCKER
	@if $(IS_IN_DOCKER); then \
		echo "[ERROR] Cannot be executed inside Docker."; \
		exit 1; \
	fi
endef

define IS_APP_RUNNING
	docker compose ps --status running app --services 2>/dev/null | grep -q '^app$$'
endef

define CHECK_APP_RUNNING
	@if $(IS_APP_RUNNING); then \
		echo "[ERROR] Docker app is running."; \
		exit 1; \
	fi
endef

define RUN_CMD
	echo $(1); \
	$(1)
endef

.PHONY: up up-all
up:
	$(call CHECK_OUTSIDE_DOCKER)
	docker compose up --build
up-all: up

.PHONY: up-d up-all-d
up-d:
	$(call CHECK_OUTSIDE_DOCKER)
	docker compose up -d --build
up-all-d: up-d

.PHONY: down
down:
	$(call CHECK_OUTSIDE_DOCKER)
	docker compose down

.PHONY: bash
bash:
	$(call CHECK_OUTSIDE_DOCKER)
	docker compose exec app bash

.PHONY: bash-new
bash-new:
	$(call CHECK_OUTSIDE_DOCKER)
	docker compose run --rm app bash

.PHONY: yarn install
yarn:
	@if $(IS_IN_DOCKER) || ! $(IS_APP_RUNNING); then \
		echo "NODE_ENV=development yarn install"; \
		NODE_ENV=development yarn install; \
	else \
		CMD="docker compose exec -e NODE_ENV=development app yarn install"; \
		echo $$CMD; \
		$$CMD; \
	fi
install: yarn

.PHONY: dev
dev:
	$(call CHECK_OUTSIDE_DOCKER)
	$(call CHECK_APP_RUNNING)
	yarn dev -o

.PHONY: lint l
lint:
	@CMD="yarn lint:fix"; \
	if $(IS_IN_DOCKER) || ! $(IS_APP_RUNNING); then $(call RUN_CMD,$$CMD); else $(call RUN_CMD,docker compose exec app $$CMD); fi
l: lint

.PHONY: test
test:
	@CMD="yarn test:watch $(wordlist 2, $(words $(MAKECMDGOALS)), $(MAKECMDGOALS))"; \
	if $(IS_IN_DOCKER) || ! $(IS_APP_RUNNING); then $(call RUN_CMD,$$CMD); else $(call RUN_CMD,docker compose exec app $$CMD); fi
	if [ $(words $(MAKECMDGOALS)) -eq 1 ]; then open coverage/index.html; fi

.PHONY: generate
generate:
	@CMD="yarn generate"; \
	if $(IS_IN_DOCKER) || ! $(IS_APP_RUNNING); then $(call RUN_CMD,$$CMD); else $(call RUN_CMD,docker compose exec app $$CMD); fi
