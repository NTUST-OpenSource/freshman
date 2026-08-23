#!/usr/bin/env bash
# Review status for one pull request: Greptile's confidence score plus the number
# of review threads still open. Exits 0 only at 5/5 with zero open threads.
#
# Open threads are counted regardless of author: an unresolved human comment
# blocks completion the same way a Greptile finding does, which is intended.
#
# The state has to come from GraphQL: `gh pr view` returns conversation comments
# only, never inline review threads, so it cannot see whether findings are
# resolved. Greptile also posts its review with an empty body and the score in a
# separate conversation comment, so taking the last greptile-authored item finds
# nothing -- the score has to be matched across every comment it wrote.
set -uo pipefail

usage() { echo "usage: $0 <pr-number> [--watch] [--interval seconds] [--max polls]" >&2; exit 2; }

PR=""
WATCH=0
INTERVAL=30
MAX=60
while [ $# -gt 0 ]; do
  case "$1" in
    --watch) WATCH=1 ;;
    --interval) INTERVAL=${2:-}; shift ;;
    --max) MAX=${2:-}; shift ;;
    *) if [ -z "$PR" ]; then PR=$1; else usage; fi ;;
  esac
  shift
done
[ -n "$PR" ] || usage
case "$PR$INTERVAL$MAX" in "" | *[!0-9]*) usage ;; esac
REPO=${GREPTILE_REPO:-NTUST-OpenSource/freshman}

status() {
  gh api graphql -F owner="${REPO%/*}" -F name="${REPO#*/}" -F pr="$PR" -f query='
query($owner:String!,$name:String!,$pr:Int!){
  repository(owner:$owner,name:$name){
    pullRequest(number:$pr){
      comments(last:100){nodes{author{login} body}}
      reviewThreads(first:100){nodes{isResolved comments(first:1){nodes{path line body}}}}
    }
  }
}' --jq '
.data.repository.pullRequest as $pr
| ([$pr.comments.nodes[]
    | select((.author.login // "") | test("greptile";"i"))
    | .body | match("(?i)confidence score[^0-9]*([0-9]+)\\s*/\\s*5")
    | .captures[0].string] | last) as $score
| [$pr.reviewThreads.nodes[] | select(.isResolved | not)] as $open
| {score: ($score // "none"),
   unresolved: ($open | length),
   threads: [$open[] | {path: .comments.nodes[0].path,
                        line: .comments.nodes[0].line,
                        body: (.comments.nodes[0].body | gsub("<[^>]*>";"") | .[0:400])}]}'
}

for _ in $(seq 1 "$MAX"); do
  out=$(status 2>/dev/null)
  # A missing pull request still writes the raw error envelope to stdout, so the
  # shape has to be checked rather than just the emptiness.
  if ! printf '%s' "$out" | jq -e 'has("score")' >/dev/null 2>&1; then
    echo "greptile status query failed for PR $PR in $REPO" >&2
    exit 3
  fi
  echo "$out"
  score=$(printf '%s' "$out" | jq -r .score)
  open=$(printf '%s' "$out" | jq -r .unresolved)
  if [ "$score" = "5" ] && [ "$open" = "0" ]; then echo GREPTILE_PASS; exit 0; fi
  [ "$WATCH" = "1" ] || exit 1
  sleep "$INTERVAL"
done
echo GREPTILE_TIMEOUT
exit 4
