#!/usr/bin/env bash
#
# Local production security-scan pipeline. Mirrors the CI security job and
# produces auditable output under ./security-reports/.
#
#   Runs: dependency audit (npm), SBOM (CycloneDX), secret scan (secretlint),
#         a SAST pattern sweep, typecheck and the automated test suites.
#
# Usage:  bash scripts/security-scan.sh
#
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/security-reports"
mkdir -p "$OUT"
FAIL=0
say() { printf '\n\033[1;36m== %s ==\033[0m\n' "$1"; }

# ── 1. Dependency vulnerability audit ─────────────────────────────────────────
say "1. Dependency audit (npm)"
for pkg in backend frontend; do
  ( cd "$ROOT/$pkg" && npm audit --json > "$OUT/audit-$pkg.json" 2>/dev/null )
  node -e "const a=require('$OUT/audit-$pkg.json').metadata.vulnerabilities; \
    console.log('$pkg:', JSON.stringify(a)); \
    if((a.critical||0)+(a.high||0)>0){process.exitCode=1}" || FAIL=1
done

# ── 2. Software Bill of Materials (CycloneDX) ─────────────────────────────────
say "2. SBOM (CycloneDX)"
for pkg in backend frontend; do
  ( cd "$ROOT/$pkg" && npm sbom --sbom-format=cyclonedx --sbom-type=application \
      > "$OUT/sbom-$pkg.json" 2>/dev/null ) \
    && echo "$pkg SBOM -> security-reports/sbom-$pkg.json ($(node -e "console.log(require('$OUT/sbom-$pkg.json').components.length)") components)"
done

# ── 3. Secret scan ────────────────────────────────────────────────────────────
say "3. Secret scan (secretlint)"
if command -v secretlint >/dev/null 2>&1; then
  ( cd "$ROOT" && secretlint "**/*" --format stylish 2>/dev/null | tee "$OUT/secrets.txt" ) || true
  echo "(clean = no secrets detected)"
else
  echo "secretlint not installed — skipping" | tee "$OUT/secrets.txt"
fi

# ── 4. SAST pattern sweep ─────────────────────────────────────────────────────
say "4. SAST pattern sweep (dangerous sinks / weak config)"
{
  echo "# SAST pattern sweep — $(date -u)"
  for pat in \
    'eval\(|child_process|execSync' \
    'queryRawUnsafe|executeRawUnsafe' \
    'dangerouslySetInnerHTML' \
    "process\.env\.[A-Z_]+ *\|\| *['\"]" \
    'md5|createHash\(.md5.\)'; do
    echo "## pattern: $pat"
    grep -rnE "$pat" "$ROOT/backend/src" "$ROOT/frontend/src" --include=*.ts --include=*.tsx 2>/dev/null \
      | grep -v node_modules || echo "  (none)"
  done
} | tee "$OUT/sast-sweep.txt"

# ── 5. Typecheck ──────────────────────────────────────────────────────────────
say "5. Typecheck (tsc --noEmit)"
( cd "$ROOT/backend" && npx tsc --noEmit )  && echo "backend: clean"  || FAIL=1
( cd "$ROOT/frontend" && npx tsc --noEmit ) && echo "frontend: clean" || FAIL=1

# ── 6. Automated tests ────────────────────────────────────────────────────────
say "6. Automated tests"
( cd "$ROOT/backend" && npm run test:ci )  || FAIL=1
( cd "$ROOT/frontend" && npm test )        || FAIL=1

say "DONE"
echo "Reports written to security-reports/"
[ "$FAIL" -eq 0 ] && echo "RESULT: PASS" || echo "RESULT: FAIL (see output above)"
exit "$FAIL"
