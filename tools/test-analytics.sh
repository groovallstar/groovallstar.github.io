#!/usr/bin/env bash
set -eu

PRODUCTION_DIR="_site-analytics-production"
DEVELOPMENT_DIR="_site-analytics-development"
DISABLED_DIR="_site-analytics-disabled"
MISSING_CODE_DIR="_site-analytics-missing-code"
MISSING_HOST_DIR="_site-analytics-missing-host"
EMPTY_HOST_DIR="_site-analytics-empty-host"
CLIENT_MARKER='/assets/js/analytics.js'

cleanup() {
  rm -rf \
    "$PRODUCTION_DIR" \
    "$DEVELOPMENT_DIR" \
    "$DISABLED_DIR" \
    "$MISSING_CODE_DIR" \
    "$MISSING_HOST_DIR" \
    "$EMPTY_HOST_DIR"
}
trap cleanup EXIT

JEKYLL_ENV=production bundle exec jekyll build --quiet --destination "$PRODUCTION_DIR"
JEKYLL_ENV=development bundle exec jekyll build --quiet --destination "$DEVELOPMENT_DIR"
JEKYLL_ENV=production bundle exec jekyll build --quiet \
  --config _config.yml,test/fixtures/analytics-disabled.yml \
  --destination "$DISABLED_DIR"
JEKYLL_ENV=production bundle exec jekyll build --quiet \
  --config test/fixtures/analytics-missing-code.yml \
  --destination "$MISSING_CODE_DIR"
JEKYLL_ENV=production bundle exec jekyll build --quiet \
  --config test/fixtures/analytics-missing-host.yml \
  --destination "$MISSING_HOST_DIR"
JEKYLL_ENV=production bundle exec jekyll build --quiet \
  --config _config.yml,test/fixtures/analytics-empty-host.yml \
  --destination "$EMPTY_HOST_DIR"

production_html_count=0
while IFS= read -r -d '' html_file; do
  production_html_count=$((production_html_count + 1))
  client_count="$(grep -o -F "$CLIENT_MARKER" "$html_file" | wc -l | tr -d ' ')"
  if test "$client_count" -ne 1; then
    echo "Analytics client must appear exactly once in $html_file (found $client_count)" >&2
    exit 1
  fi
  if grep -F 'https://gc.zgo.at/count.js' "$html_file"; then
    echo "The mutable upstream GoatCounter client must not appear in $html_file" >&2
    exit 1
  fi
done < <(find "$PRODUCTION_DIR" -type f -name '*.html' -print0)

if test "$production_html_count" -eq 0; then
  echo "Production build did not generate any HTML pages" >&2
  exit 1
fi

production_index="$PRODUCTION_DIR/index.html"
grep -F 'https://marrh.goatcounter.com/count' "$production_index"
grep -F 'data-goatcounter-host="groovallstar.github.io"' "$production_index"
grep -F 'data-goatcounter-click="post-click/posts/ai-era-expertise/"' "$production_index"
grep -F 'data-goatcounter-title="AI 시대, 전문성은 사라지는가"' "$production_index"
grep -F 'data-goatcounter-no-session="1"' "$production_index"

for build_dir in \
  "$DEVELOPMENT_DIR" \
  "$DISABLED_DIR" \
  "$MISSING_CODE_DIR" \
  "$MISSING_HOST_DIR" \
  "$EMPTY_HOST_DIR"; do
  if grep -R --include='*.html' -F "$CLIENT_MARKER" "$build_dir"; then
    echo "Analytics client must be absent from every HTML page in $build_dir" >&2
    exit 1
  fi
done

node tools/test-analytics-client.js

CREDENTIAL_PATTERN='(^|[^[:alnum:]_])(api[_-]?key|password|secret|token)([^[:alnum:]_]|$)'
for credential_key in api_key password secret token; do
  if ! printf 'goatcounter:\n  %s: example-value\n' "$credential_key" | grep -Eq "$CREDENTIAL_PATTERN"; then
    echo "Credential scan does not detect multiline GoatCounter key: $credential_key" >&2
    exit 1
  fi
done

analytics_files=(
  _config.yml
  _includes/analytics.html
  _includes/post-entry.html
  _layouts/default.html
)
if test -f assets/js/analytics.js; then
  analytics_files+=(assets/js/analytics.js)
fi

if grep -n -Ei "$CREDENTIAL_PATTERN" "${analytics_files[@]}"; then
  echo "Analytics implementation and configuration must not contain credentials" >&2
  exit 1
fi

echo "Analytics contract passed for $production_html_count production HTML pages."
