#!/usr/bin/env python3
"""Review status for one pull request: the Greptile confidence score plus the
number of review threads still open. Exits 0 only at 5/5 with zero open threads.

The state has to come from GraphQL. `gh pr view` returns conversation comments
only, never inline review threads, so it cannot see whether findings are
resolved. Greptile posts its review with an empty body and the score in a
separate conversation comment, so taking the last item it authored reads empty.
It also EDITS that comment in place on re-review, so the newest score is the one
with the greatest updatedAt, not the one latest in the list.

Freshness is decided by the commit oid its review carries, never by a timestamp:
committedDate is author-side, so a rebase or a late push leaves a stale score
looking newer than the head commit and passes work nothing has reviewed.

Open threads are counted regardless of author: an unresolved human comment
blocks completion the same way a Greptile finding does, which is intended.
Threads are paginated because omitting a page would under-count and pass.
"""

import argparse
import json
import re
import subprocess
import sys
import time

SCORE_RE = re.compile(r"confidence score[^0-9]*([0-9]+)\s*/\s*5", re.I)
TAG_RE = re.compile(r"<[^>]*>")

HEAD_Q = """
query($owner:String!,$name:String!,$pr:Int!){
  repository(owner:$owner,name:$name){pullRequest(number:$pr){
    headRefOid
    reviews(last:30){nodes{author{login} commit{oid}}}
    comments(last:100){nodes{author{login} body updatedAt}}
  }}}
"""

THREADS_Q = """
query($owner:String!,$name:String!,$pr:Int!,$cursor:String){
  repository(owner:$owner,name:$name){pullRequest(number:$pr){
    reviewThreads(first:100, after:$cursor){
      pageInfo{hasNextPage endCursor}
      nodes{isResolved comments(first:1){nodes{path line body}}}
    }}}}
"""


def gql(query, pr, cursor=None, **strings):
    cmd = ["gh", "api", "graphql", "-f", f"query={query}", "-F", f"pr={pr}"]
    # -f keeps every other variable a String: -F coerces JSON types, so an
    # all-numeric owner or repo name would be sent as an Int and fail validation.
    for key, value in strings.items():
        cmd += ["-f", f"{key}={value}"]
    if cursor is not None:
        cmd += ["-f", f"cursor={cursor}"]
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode != 0:
        raise RuntimeError(done.stderr.strip() or "gh api graphql failed")
    payload = json.loads(done.stdout)
    if payload.get("errors"):
        raise RuntimeError(payload["errors"][0].get("message", "graphql error"))
    # A missing or inaccessible repository comes back as null with no errors, so
    # every level has to be checked rather than subscripted straight through.
    repo = (payload.get("data") or {}).get("repository")
    pull = (repo or {}).get("pullRequest")
    if pull is None:
        raise RuntimeError("pull request not found or not accessible")
    return pull


def is_greptile(node):
    return "greptile" in (((node or {}).get("author") or {}).get("login") or "").lower()


def status(owner, name, pr):
    head_data = gql(HEAD_Q, pr, owner=owner, name=name)
    head = head_data["headRefOid"]

    reviewed = [
        r for r in head_data["reviews"]["nodes"]
        if is_greptile(r) and ((r.get("commit") or {}).get("oid") == head)
    ]

    scored = []
    for comment in head_data["comments"]["nodes"]:
        if not is_greptile(comment):
            continue
        found = SCORE_RE.search(comment.get("body") or "")
        if found:
            scored.append((comment["updatedAt"], found.group(1)))
    scored.sort()

    open_threads, cursor = [], None
    while True:
        page = gql(THREADS_Q, pr, cursor=cursor, owner=owner, name=name)["reviewThreads"]
        open_threads += [t for t in page["nodes"] if not t["isResolved"]]
        if not page["pageInfo"]["hasNextPage"]:
            break
        cursor = page["pageInfo"]["endCursor"]

    return {
        # No review against the current head means nothing has looked at this
        # revision yet, whatever score is still displayed on the pull request.
        "score": scored[-1][1] if (reviewed and scored) else "none",
        "unresolved": len(open_threads),
        "head": head,
        "threads": [
            {
                "path": t["comments"]["nodes"][0]["path"],
                "line": t["comments"]["nodes"][0]["line"],
                "body": TAG_RE.sub("", t["comments"]["nodes"][0]["body"] or "")[:400],
            }
            for t in open_threads
        ],
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pr", type=int)
    ap.add_argument("--repo", default="NTUST-OpenSource/freshman")
    ap.add_argument("--watch", action="store_true")
    ap.add_argument("--interval", type=int, default=30)
    ap.add_argument("--max", type=int, default=60)
    args = ap.parse_args()
    owner, _, name = args.repo.partition("/")

    for poll in range(args.max):
        try:
            current = status(owner, name, args.pr)
        except (RuntimeError, KeyError, IndexError, TypeError, json.JSONDecodeError) as err:
            print(f"greptile status query failed for PR {args.pr} in {args.repo}: {err}", file=sys.stderr)
            return 3
        print(json.dumps(current, ensure_ascii=False), flush=True)
        if current["score"] == "5" and current["unresolved"] == 0:
            print("GREPTILE_PASS", flush=True)
            return 0
        if not args.watch:
            return 1
        if poll < args.max - 1:
            time.sleep(args.interval)
    print("GREPTILE_TIMEOUT", flush=True)
    return 4


if __name__ == "__main__":
    sys.exit(main())
