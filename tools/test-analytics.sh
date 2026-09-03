#!/usr/bin/env bash
set -eu

PRODUCTION_DIR="_site-analytics-production"
DEVELOPMENT_DIR="_site-analytics-development"
DISABLED_DIR="_site-analytics-disabled"

cleanup() {
  rm -rf "$PRODUCTION_DIR" "$DEVELOPMENT_DIR" "$DISABLED_DIR"
}
trap cleanup EXIT

JEKYLL_ENV=production bundle exec jekyll build --quiet --destination "$PRODUCTION_DIR"
JEKYLL_ENV=development bundle exec jekyll build --quiet --destination "$DEVELOPMENT_DIR"
JEKYLL_ENV=production bundle exec jekyll build --quiet \
  --config _config.yml,test/fixtures/analytics-disabled.yml \
  --destination "$DISABLED_DIR"

production_index="$PRODUCTION_DIR/index.html"
development_index="$DEVELOPMENT_DIR/index.html"
disabled_index="$DISABLED_DIR/index.html"

loader_count="$(grep -o 'https://gc.zgo.at/count.js' "$production_index" | wc -l | tr -d ' ')"
test "$loader_count" -eq 1

grep -F 'https://marrh.goatcounter.com/count' "$production_index"
grep -F 'window.location.hostname !== "groovallstar.github.io"' "$production_index"
grep -F 'path: function () {' "$production_index"
grep -F 'return window.location.pathname;' "$production_index"

grep -F 'data-goatcounter-click="post-click/posts/ai-era-expertise/"' "$production_index"
grep -F 'data-goatcounter-title="AI 시대, 전문성은 사라지는가"' "$production_index"
grep -F 'data-goatcounter-no-session="1"' "$production_index"

if grep -R --include='*.html' -F 'https://gc.zgo.at/count.js' "$DEVELOPMENT_DIR" "$DISABLED_DIR"; then
  echo "GoatCounter loader must be absent from development and disabled builds" >&2
  exit 1
fi

if git grep -n -Ei 'goatcounter.*(password|api[_-]?key|token)' -- ':!docs/superpowers/**' ':!tools/test-analytics.sh'; then
  echo "GoatCounter credentials must not be committed" >&2
  exit 1
fi
