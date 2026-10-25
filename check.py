#!/usr/bin/env python3
"""Validate the blocklists. With --live, check this network's DNS actually blocks them."""
import re
import socket
import sys
from pathlib import Path

RULE = re.compile(r"^\|\|([a-z0-9-]+(?:\.[a-z0-9-]+)+)\^$")
SINKHOLE = {"0.0.0.0", "::", "127.0.0.1", "::1"}
LISTS = ["blocklist.txt", "blocklist-aggressive.txt"]


def domains(path):
    out = []
    for n, line in enumerate(path.read_text().splitlines(), 1):
        if not line.strip() or line.startswith("!"):
            continue
        m = RULE.match(line.strip())
        assert m, f"{path.name}:{n}: bad rule {line!r}"
        out.append(m.group(1))
    return out


def blocked(domain):
    try:
        addrs = {a[4][0] for a in socket.getaddrinfo(domain, None)}
    except socket.gaierror:
        # ponytail: also true for an apex with no A record, so "block" can be a false pass.
        # Upgrade: probe a known-live subdomain per rule if that matters.
        return True
    return addrs <= SINKHOLE


def main():
    here = Path(__file__).parent
    seen = {}
    for name in LISTS:
        for d in domains(here / name):
            assert d not in seen, f"{d} in both {seen[d]} and {name}"
            seen[d] = name
    print(f"ok: {len(seen)} rules")

    if "--live" in sys.argv:
        leaks = [d for d in seen if not blocked(d)]
        for d in seen:
            print(f"{'LEAK ' if d in leaks else 'block'}  {d}  ({seen[d]})")
        sys.exit(1 if leaks else 0)


if __name__ == "__main__":
    main()
