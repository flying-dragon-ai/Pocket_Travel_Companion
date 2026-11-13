#!/usr/bin/env bash
# 后端联调冒烟：需本地已启动 API（默认 http://127.0.0.1:3000）
set -euo pipefail
BASE="${API_BASE_URL:-http://127.0.0.1:3000}"
CODE="${SMOKE_LOGIN_CODE:-smoke-$(date +%s)}"

echo "==> GET /health"
curl -fsS "$BASE/health" | tee /dev/stderr >/dev/null
echo

echo "==> POST /api/v1/auth/login code=$CODE"
LOGIN_JSON=$(curl -fsS -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}")
TOKEN=$(node -e "const j=JSON.parse(process.argv[1]); if(j.code!==0){console.error(j);process.exit(1)}; console.log(j.data.token)" "$LOGIN_JSON")
echo "token length: ${#TOKEN}"

AUTH=(-H "Authorization: Bearer $TOKEN")

echo "==> GET /api/v1/user/profile"
curl -fsS "$BASE/api/v1/user/profile" "${AUTH[@]}"

echo
echo "==> GET /api/v1/beans/balance"
curl -fsS "$BASE/api/v1/beans/balance" "${AUTH[@]}"

echo
echo "==> GET /api/v1/mood-map/profile"
curl -fsS "$BASE/api/v1/mood-map/profile" "${AUTH[@]}"

echo
echo "==> GET /api/v1/routes"
curl -fsS "$BASE/api/v1/routes" "${AUTH[@]}"

echo
echo "==> GET /api/v1/spots"
curl -fsS "$BASE/api/v1/spots" "${AUTH[@]}"

echo
echo "==> POST /api/v1/routes/import-link"
IMPORT_JSON=$(curl -fsS -X POST "$BASE/api/v1/routes/import-link" "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/note/123"}')
RID=$(node -e "const j=JSON.parse(process.argv[1]); if(j.code!==0){console.error(j);process.exit(1)}; console.log(j.data.routeId)" "$IMPORT_JSON")
echo "routeId=$RID"

echo "==> GET /api/v1/routes/$RID"
curl -fsS "$BASE/api/v1/routes/$RID" "${AUTH[@]}"

echo
echo "==> POST /api/v1/share/route"
SHARE_JSON=$(curl -fsS -X POST "$BASE/api/v1/share/route" "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"routeId\":$RID}")
SHARE_CODE=$(node -e "const j=JSON.parse(process.argv[1]); if(j.code!==0){console.error(j);process.exit(1)}; console.log(j.data.shareCode)" "$SHARE_JSON")
echo "shareCode=$SHARE_CODE"

echo "==> GET /api/v1/share/$SHARE_CODE (no auth)"
curl -fsS "$BASE/api/v1/share/$SHARE_CODE"

echo
echo "==> DELETE /api/v1/routes/$RID"
curl -fsS -X DELETE "$BASE/api/v1/routes/$RID" "${AUTH[@]}"

echo
echo "OK smoke finished."
