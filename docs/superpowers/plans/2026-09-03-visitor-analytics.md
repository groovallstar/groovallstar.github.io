# Visitor Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-friendly GoatCounter pageview analytics and repeatable post-card click events to the production blog, visible only in the owner's GoatCounter dashboard.

**Architecture:** Jekyll renders one analytics include from the shared default layout. The include is emitted only for production builds with a configured public site code, and its bootstrap checks the browser hostname before loading GoatCounter asynchronously; post-card links expose GoatCounter's declarative event attributes without intercepting navigation.

**Tech Stack:** Jekyll 4.4, Liquid templates, GoatCounter hosted `count.js`, Bash regression checks, GitHub Actions and GitHub Pages

**Spec:** `docs/superpowers/specs/2026-09-03-visitor-analytics-design.md`

## Global Constraints

- Use the public GoatCounter site code `marrh` and production host `groovallstar.github.io`.
- Never commit the GoatCounter password, API key, email address, cookies, local-storage identifiers, or arbitrary visitor identifiers.
- Send page paths without URL query strings by setting GoatCounter's pageview path to `window.location.pathname`.
- Track post-card clicks as events whose names start with `post-click`, because GoatCounter event paths cannot begin with `/`.
- Add `data-goatcounter-no-session="1"` so repeated clicks are counted.
- Do not display a public counter, a dashboard link, or an administrator page on the blog.
- Do not load GoatCounter in development builds or on a hostname other than `groovallstar.github.io`.
- Analytics failures must not delay rendering, cancel clicks, or change normal link navigation.
- Preserve the untracked `tmp/` directory and exclude it from every commit.

---

## File Structure

- Create `_includes/analytics.html`: owns all production gating, hostname gating, data minimization, and asynchronous loading of GoatCounter.
- Modify `_config.yml`: stores only the public GoatCounter code and production hostname.
- Modify `_layouts/default.html`: invokes the analytics include exactly once after page content.
- Modify `_includes/post-entry.html`: declares a stable click event on each post-card link.
- Create `tools/test-analytics.sh`: builds production, development, and disabled configurations and checks the rendered analytics contract.
- Create `test/fixtures/analytics-disabled.yml`: overrides the public code with an empty value for the disabled-state regression test.
- Modify `README.md`: documents what is counted, where the owner views it, and which configuration value controls it.

### Task 1: Add a Failing Analytics Rendering Contract

**Files:**
- Create: `tools/test-analytics.sh`
- Create: `test/fixtures/analytics-disabled.yml`

**Interfaces:**
- Consumes: Jekyll configuration keys `goatcounter.code` and `goatcounter.production_host`; the shared output layout; post cards rendered with class `entry-link`.
- Produces: executable command `bash tools/test-analytics.sh`, which exits non-zero on a missing or duplicated loader, leaked development tracking, missing hostname/path safeguards, missing click attributes, or committed credentials.

- [ ] **Step 1: Create the disabled configuration fixture**

```yaml
goatcounter:
  code: ""
  production_host: "groovallstar.github.io"
```

- [ ] **Step 2: Write the analytics rendering test**

```bash
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
grep -F 'data-goatcounter-title="AI 시대의 전문성: 지식보다 중요한 것은 문제를 푸는 힘"' "$production_index"
grep -F 'data-goatcounter-no-session="1"' "$production_index"

if grep -R -F 'https://gc.zgo.at/count.js' "$DEVELOPMENT_DIR" "$DISABLED_DIR"; then
  echo "GoatCounter loader must be absent from development and disabled builds" >&2
  exit 1
fi

if git grep -n -Ei 'goatcounter.*(password|api[_-]?key|token)' -- ':!docs/superpowers/**' ':!tools/test-analytics.sh'; then
  echo "GoatCounter credentials must not be committed" >&2
  exit 1
fi
```

- [ ] **Step 3: Run the test and verify the missing integration fails**

Run:

```bash
bash tools/test-analytics.sh
```

Expected: non-zero exit after the production build because `https://gc.zgo.at/count.js` is absent.

- [ ] **Step 4: Commit the failing contract**

```bash
git add tools/test-analytics.sh test/fixtures/analytics-disabled.yml
git commit -m "test: define visitor analytics contract"
```

### Task 2: Render Production-Only Pageviews and Post Click Events

**Files:**
- Create: `_includes/analytics.html`
- Modify: `_config.yml`
- Modify: `_layouts/default.html`
- Modify: `_includes/post-entry.html`
- Test: `tools/test-analytics.sh`

**Interfaces:**
- Consumes: `site.goatcounter.code` with value `marrh`, `site.goatcounter.production_host` with value `groovallstar.github.io`, `jekyll.environment`, and each post's `post.url` and `post.title`.
- Produces: a production-only loader endpoint `https://marrh.goatcounter.com/count`; pageview path callback returning `window.location.pathname`; click event names shaped as `post-click{{ post.url }}`; click titles equal to `post.title`.

- [ ] **Step 1: Add the public analytics configuration**

Append this site-level configuration after `github.username` in `_config.yml`:

```yaml
goatcounter:
  code: "marrh"
  production_host: "groovallstar.github.io"
```

- [ ] **Step 2: Create the guarded asynchronous analytics include**

Create `_includes/analytics.html` with:

```liquid
{%- if jekyll.environment == "production" and site.goatcounter.code != empty -%}
<script>
  (function () {
    if (window.location.hostname !== {{ site.goatcounter.production_host | jsonify }}) return;

    window.goatcounter = {
      path: function () {
        return window.location.pathname;
      }
    };

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.dataset.goatcounter = 'https://{{ site.goatcounter.code }}.goatcounter.com/count';
    document.head.appendChild(script);
  })();
</script>
{%- endif -%}
```

- [ ] **Step 3: Invoke analytics once from the shared layout**

Insert the include immediately before the existing `assets/js/main.js` script in `_layouts/default.html`:

```liquid
  {%- include analytics.html -%}
  <script src="{{ '/assets/js/main.js' | relative_url }}"></script>
```

- [ ] **Step 4: Declare post-card click events without JavaScript interception**

Replace the post link in `_includes/post-entry.html` with:

```liquid
  <a class="entry-link"
     aria-label="{{ post.title }} 글로 이동"
     href="{{ post.url | relative_url }}"
     data-goatcounter-click="post-click{{ post.url }}"
     data-goatcounter-title="{{ post.title | escape }}"
     data-goatcounter-no-session="1"></a>
```

- [ ] **Step 5: Run the focused analytics contract**

Run:

```bash
bash tools/test-analytics.sh
```

Expected: exit code 0; production output contains one guarded loader and click attributes, while development and disabled outputs contain no GoatCounter loader.

- [ ] **Step 6: Run the full site build and link check**

Run:

```bash
JEKYLL_ENV=production bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/"
```

Expected: both commands exit 0. If the local Windows Ruby installation cannot load libcurl, record that environment limitation and require the GitHub Actions `Test site` step to pass in Task 4 before deployment is considered verified.

- [ ] **Step 7: Review the rendered data surface**

Run:

```bash
grep -R -n -E 'goatcounter|data-goatcounter' _site | head -50
```

Expected: output contains only the public endpoint, production hostname, `window.location.pathname`, post event name, post title, and `no-session` flag; it contains no email, password, token, API key, arbitrary identifier, localStorage value, or query-string expression.

- [ ] **Step 8: Commit the integration**

```bash
git add _config.yml _includes/analytics.html _includes/post-entry.html _layouts/default.html
git commit -m "feat: add privacy-friendly visitor analytics"
```

### Task 3: Document Owner Operation and Privacy Boundaries

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the `marrh` GoatCounter site, the events produced by Task 2, and the existing README structure.
- Produces: an operator-facing `방문자 통계` section that identifies the private dashboard, tracked fields, local exclusion, ad-blocker limitation, and safe configuration boundary.

- [ ] **Step 1: Add the analytics operations section**

Insert this section before `## 구조` in `README.md`:

```markdown
## 방문자 통계

운영 사이트에서만 [GoatCounter 관리자 화면](https://marrh.goatcounter.com/)으로 페이지 조회와 포스트 카드 클릭을 집계한다.

- 페이지 조회 경로에는 URL 쿼리 문자열을 포함하지 않는다.
- 포스트 클릭은 `post-click/posts/...` 이벤트로 기록하며 빠른 반복 클릭도 각각 집계한다.
- 로컬 개발 서버와 다른 도메인에서는 분석 스크립트를 불러오지 않는다.
- 광고 차단기가 GoatCounter를 막으면 해당 방문이나 클릭은 통계에서 빠질 수 있다.
- 저장소에는 공개 사이트 코드 `marrh`만 두며 비밀번호와 API 키는 기록하지 않는다.
```

- [ ] **Step 2: Re-run analytics and content verification**

Run:

```bash
bash tools/test-analytics.sh
JEKYLL_ENV=production bundle exec jekyll build
git diff --check
```

Expected: all commands exit 0 and the generated site remains valid.

- [ ] **Step 3: Commit the documentation**

```bash
git add README.md
git commit -m "docs: explain visitor analytics operation"
```

### Task 4: Deploy and Verify the Live Data Flow

**Files:**
- Verify: `.github/workflows/pages-deploy.yml`
- Verify: deployed HTML at `https://groovallstar.github.io/`
- Verify: private dashboard at `https://marrh.goatcounter.com/`

**Interfaces:**
- Consumes: the three commits from Tasks 1-3 and the existing GitHub Pages workflow.
- Produces: a successful Pages deployment, HTTP 200 production pages, one live GoatCounter loader, a visible pageview, and a visible post-click event in the owner's dashboard.

- [ ] **Step 1: Confirm the commit contains no unrelated or sensitive files**

Run:

```bash
git status --short
git diff origin/main...HEAD --name-only
git grep -n -Ei 'goatcounter.*(password|api[_-]?key|secret|token)' -- ':!docs/superpowers/**'
```

Expected: `tmp/` may remain untracked but is not staged; the diff contains only the analytics plan, tests, fixture, include, configuration, layout, post entry, and README; no GoatCounter credential is found.

- [ ] **Step 2: Push the reviewed commits**

```bash
git push origin main
```

Expected: the push succeeds and triggers the existing `Build and Deploy` workflow.

- [ ] **Step 3: Wait for GitHub Pages verification**

Run:

```bash
run_id="$(gh run list --workflow pages-deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$run_id" --exit-status
```

Expected: `Build site`, `Test site`, `Upload site artifact`, and `Deploy` all succeed.

- [ ] **Step 4: Verify the live pages and rendered analytics markers**

Run:

```bash
curl -fsS -o live-home.html https://groovallstar.github.io/
curl -fsS -o live-post.html https://groovallstar.github.io/posts/ai-era-expertise/
grep -F 'https://gc.zgo.at/count.js' live-home.html
grep -F 'https://marrh.goatcounter.com/count' live-home.html
grep -F 'data-goatcounter-click="post-click/posts/ai-era-expertise/"' live-home.html
rm live-home.html live-post.html
```

Expected: both downloads return HTTP 200 and all three marker checks succeed.

- [ ] **Step 5: Verify failure isolation in a browser**

Open the live homepage with `gc.zgo.at` blocked in browser developer tools, click the AI expertise post card, and confirm navigation reaches `https://groovallstar.github.io/posts/ai-era-expertise/` without delay or error.

- [ ] **Step 6: Verify pageview and click records in the owner dashboard**

With GoatCounter allowed, load the live homepage once, click the AI expertise post card once, wait at least 10 seconds, then open `https://marrh.goatcounter.com/`. Confirm a `/` pageview and a `post-click/posts/ai-era-expertise/` event are visible as separate entries.

- [ ] **Step 7: Record deployment completion**

Run:

```bash
git status --short
```

Expected: no tracked changes remain; only the pre-existing untracked `tmp/` directory may be listed.
