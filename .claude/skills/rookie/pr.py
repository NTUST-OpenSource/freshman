#!/usr/bin/env python3
"""Pull request helpers for the rookie contribution flow.

Subcommands:
  open      create the pull request against dev, linked to its issue
  trigger   ask Greptile for a review when one is not already running
  status    confidence score and open review threads for a pull request
  threads   list the open review threads with their ids
  resolve   reply to one review thread and mark it resolved

Follows the review-reading contract of the upstream greploop skill: the Greptile
check run on the head sha says whether this revision has been reviewed, and the
score is read from whichever of the pull request body, its reviews or its
conversation comments carries the most recent one.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from typing import Any

REPO = "NTUST-OpenSource/freshman"
BASE = "dev"
REVIEWER = "xinshoutw"

SCORE_RE = re.compile(r"confidence score[^0-9]*([0-9]+)\s*/\s*5", re.I)
TAG_RE = re.compile(r"<[^>]*>")
PR_URL_RE = re.compile(r"https://\S+/pull/(\d+)")

STATE_Q = """
query($owner:String!,$name:String!,$pr:Int!){
  repository(owner:$owner,name:$name){pullRequest(number:$pr){
    headRefOid
    body
    reviews(last:30){nodes{author{login} body submittedAt}}
    comments(last:100){nodes{author{login} body updatedAt}}
  }}}
"""

THREADS_Q = """
query($owner:String!,$name:String!,$pr:Int!,$cursor:String){
  repository(owner:$owner,name:$name){pullRequest(number:$pr){
    reviewThreads(first:100, after:$cursor){
      pageInfo{hasNextPage endCursor}
      nodes{id isResolved comments(first:1){nodes{path line body}}}
    }}}}
"""


def run(cmd: list[str]) -> str:
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode != 0:
        raise RuntimeError(done.stderr.strip() or f"{cmd[0]} failed")
    return done.stdout.strip()


def run_lenient(cmd: list[str]) -> str:
    # gh pr checks exits non-zero whenever a check is pending or failing, which is
    # exactly the state worth reading, so the exit code is ignored here.
    return subprocess.run(cmd, capture_output=True, text=True).stdout.strip()


def gql(query: str, repo: str, pr: int, cursor: str | None = None) -> dict[str, Any]:
    owner, _, name = repo.partition("/")
    cmd = ["gh", "api", "graphql", "-f", f"query={query}", "-F", f"pr={pr}",
           "-f", f"owner={owner}", "-f", f"name={name}"]
    if cursor is not None:
        cmd += ["-f", f"cursor={cursor}"]
    payload = json.loads(run(cmd))
    if payload.get("errors"):
        raise RuntimeError(payload["errors"][0].get("message", "graphql error"))
    pull = ((payload.get("data") or {}).get("repository") or {}).get("pullRequest")
    if pull is None:
        raise RuntimeError(f"pull request {repo}#{pr} not found or not accessible")
    return pull


def by_greptile(node: dict[str, Any] | None) -> bool:
    return "greptile" in (((node or {}).get("author") or {}).get("login") or "").lower()


def open_threads(repo: str, pr: int) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        page = gql(THREADS_Q, repo, pr, cursor)["reviewThreads"]
        found += [t for t in page["nodes"] if not t["isResolved"]]
        if not page["pageInfo"]["hasNextPage"]:
            return found
        cursor = page["pageInfo"]["endCursor"]


def summarise(thread: dict[str, Any]) -> dict[str, Any]:
    # A file-level thread has no line, and a thread whose comment was deleted has
    # no first comment at all; neither may abort a poll.
    head = (thread["comments"]["nodes"] or [{}])[0]
    return {
        "id": thread["id"],
        "path": head.get("path"),
        "line": head.get("line"),
        "body": TAG_RE.sub("", head.get("body") or "")[:400],
    }


def greptile_check(repo: str, sha: str) -> dict[str, Any] | None:
    runs = json.loads(run(["gh", "api", f"repos/{repo}/commits/{sha}/check-runs"]))
    for check in runs.get("check_runs", []):
        if "greptile" in (check.get("name") or "").lower():
            return check
    return None


def score_of(node: dict[str, Any], stamp: str, head: str) -> tuple[str, str] | None:
    body = node.get("body") or ""
    found = SCORE_RE.search(body)
    if not (by_greptile(node) and found and head in body):
        return None
    return (node[stamp], found.group(1))


def status(repo: str, pr: int) -> dict[str, Any]:
    state = gql(STATE_Q, repo, pr)
    head = state["headRefOid"]

    # The check run is the signal that this revision has been reviewed. Greptile
    # edits its summary in place and does not publish a review for every pass, so
    # neither one can stand in for it.
    check = greptile_check(repo, head)
    reviewed = (check or {}).get("status") == "completed" and (check or {}).get("conclusion") == "success"

    # The check is per head, but the summary is edited asynchronously, so the body
    # carrying the score must name this head too. Failing that pairing leaves the
    # score at none, which stalls rather than passing unreviewed work.
    dated = [
        found for found in (
            [score_of(r, "submittedAt", head) for r in state["reviews"]["nodes"]]
            + [score_of(c, "updatedAt", head) for c in state["comments"]["nodes"]]
        ) if found
    ]
    dated.sort()
    in_body = SCORE_RE.search(state.get("body") or "")
    score = "none"
    if reviewed:
        if dated:
            score = dated[-1][1]
        elif in_body and head in (state.get("body") or ""):
            score = in_body.group(1)

    threads = open_threads(repo, pr)
    return {
        "score": score,
        "unresolved": len(threads),
        "head": head,
        "check": f"{(check or {}).get('status', 'absent')}/{(check or {}).get('conclusion', 'none')}",
        "threads": [summarise(t) for t in threads],
    }


def cmd_status(args: argparse.Namespace) -> int:
    for poll in range(args.max):
        current = status(args.repo, args.pr)
        print(json.dumps(current, ensure_ascii=False), flush=True)
        if current["score"] == "5" and current["unresolved"] == 0:
            print("PASS", flush=True)
            return 0
        if not args.watch:
            return 1
        if poll < args.max - 1:
            time.sleep(args.interval)
    print("TIMEOUT", flush=True)
    return 4


def cmd_trigger(args: argparse.Namespace) -> int:
    raw = run_lenient(["gh", "pr", "checks", str(args.pr), "--repo", args.repo,
                       "--json", "name,state"])
    state = json.loads(raw) if raw.startswith("[") else []
    running = [c["state"] for c in state
               if "greptile" in c["name"].lower()
               and c["state"].upper() in ("PENDING", "IN_PROGRESS", "QUEUED")]
    if running:
        print(f"greptile already running: {running[0]}")
        return 0
    run(["gh", "pr", "comment", str(args.pr), "--repo", args.repo, "--body", "@greptile review"])
    print("requested a review")
    return 0


def cmd_threads(args: argparse.Namespace) -> int:
    print(json.dumps(status(args.repo, args.pr)["threads"], ensure_ascii=False, indent=2))
    return 0


def cmd_resolve(args: argparse.Namespace) -> int:
    run(["gh", "api", "graphql", "-f", "query=mutation($t:ID!,$b:String!){"
         "addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{url}}}",
         "-f", f"t={args.thread}", "-f", f"b={args.reply}"])
    run(["gh", "api", "graphql", "-f", "query=mutation($t:ID!){"
         "resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}",
         "-f", f"t={args.thread}"])
    print(f"replied and resolved {args.thread}")
    return 0


def cmd_open(args: argparse.Namespace) -> int:
    branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if branch in (BASE, "main"):
        print(f"on {branch}: open a feature branch first", file=sys.stderr)
        return 2

    # gh drops --reviewer for the pull request author without an error, so the
    # request is only sent when the reviewer is somebody else. Resolved before
    # the push so a lookup failure cannot leave a pushed branch with no PR.
    try:
        request_review = run(["gh", "api", "user", "--jq", ".login"]) != REVIEWER
    except RuntimeError:
        request_review = False

    run(["git", "push", "-u", "origin", branch])

    body = f"Closes #{args.issue}\n\n{args.body}" if args.issue else args.body
    cmd = ["gh", "pr", "create", "--repo", args.repo, "--base", BASE,
           "--head", branch, "--title", args.title, "--body", body]
    for label in args.label:
        cmd += ["--label", label]
    if request_review:
        cmd += ["--reviewer", REVIEWER]
    out = run(cmd)
    print(out)

    # gh can print notices alongside the URL, so the number comes from the last
    # pull request URL in the output rather than from the last line.
    urls = PR_URL_RE.findall(out)
    if not urls:
        raise RuntimeError("could not read the pull request number from gh output")
    number = urls[-1]
    check = json.loads(run(["gh", "pr", "view", number, "--repo", args.repo, "--json",
                            "baseRefName,labels,reviewRequests"]))
    print(json.dumps({
        "base": check["baseRefName"],
        "labels": [x["name"] for x in check["labels"]],
        "reviewers": [x.get("login") for x in check["reviewRequests"]],
    }, ensure_ascii=False))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--repo", default=REPO)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("open", help="create the pull request against dev")
    p.add_argument("--title", required=True)
    p.add_argument("--body", default="")
    p.add_argument("--issue", type=int, help="issue number to link with Closes")
    p.add_argument("--label", action="append", default=[])
    p.set_defaults(fn=cmd_open)

    p = sub.add_parser("trigger", help="ask Greptile for a review when idle")
    p.add_argument("pr", type=int)
    p.set_defaults(fn=cmd_trigger)

    p = sub.add_parser("status", help="confidence score and open review threads")
    p.add_argument("pr", type=int)
    p.add_argument("--watch", action="store_true")
    p.add_argument("--interval", type=int, default=30)
    p.add_argument("--max", type=int, default=60)
    p.set_defaults(fn=cmd_status)

    p = sub.add_parser("threads", help="list the open review threads")
    p.add_argument("pr", type=int)
    p.set_defaults(fn=cmd_threads)

    p = sub.add_parser("resolve", help="reply to one thread and resolve it")
    p.add_argument("pr", type=int)
    p.add_argument("--thread", required=True)
    p.add_argument("--reply", required=True)
    p.set_defaults(fn=cmd_resolve)

    args = ap.parse_args()
    try:
        return args.fn(args)
    except (RuntimeError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as err:
        print(err, file=sys.stderr)
        return 3


if __name__ == "__main__":
    sys.exit(main())
