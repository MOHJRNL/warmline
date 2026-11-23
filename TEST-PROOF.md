# Test proof

A fresh clone of `MOHJRNL/warmline` at commit `d323f5b`, run on 2026-11-23 with Claude Code. The test run below is the proof.

```
$ claude plugin test ./
```

```
hooks/band.test.tsx:
(pass) the band draws in en on terminal [43.62ms]
(pass) the band shows idle time once cold in en on terminal [20.69ms]
(pass) the band draws in en on desktop [21.06ms]
(pass) the band shows idle time once cold in en on desktop [20.21ms]
(pass) the band draws in en on vscode [17.78ms]
(pass) the band shows idle time once cold in en on vscode [17.66ms]
(pass) the band draws in en on mobile [17.36ms]
(pass) the band shows idle time once cold in en on mobile [17.82ms]
(pass) the band draws in ar on terminal [19.20ms]
(pass) the band shows idle time once cold in ar on terminal [26.86ms]
(pass) the band draws in ar on desktop [16.58ms]
(pass) the band shows idle time once cold in ar on desktop [16.69ms]
(pass) the band draws in ar on vscode [17.90ms]
(pass) the band shows idle time once cold in ar on vscode [16.39ms]
(pass) the band draws in ar on mobile [20.60ms]
(pass) the band shows idle time once cold in ar on mobile [17.22ms]
(pass) English is the default when no language is chosen [15.71ms]
hooks/cache.test.ts:
(pass) the last response is read from the tail, its TTL from its own write [1.61ms]
(pass) a response that only read takes the TTL of the last write [0.71ms]
(pass) a write without a TTL breakdown leaves the TTL unknown [0.24ms]
(pass) state, rebuild and keep-warm cost follow the clock and the price [0.58ms]
hooks/watch.test.tsx:
(pass) the band follows the transcript after session start [48.65ms]
(pass) a new session with no transcript yet still starts [19.87ms]
 23 pass
 0 fail
Ran 23 tests across 3 files. [0.54s]
```
