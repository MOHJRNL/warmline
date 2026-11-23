# Test proof

A fresh clone of `MOHJRNL/warmline` at commit `5bf7914`, run on 2026-11-23 with Claude Code. The test run below is the proof.

```
$ claude plugin test ./
```

```
hooks/band.test.tsx:
(pass) the band draws in en on terminal [77.42ms]
(pass) the band shows idle time once cold in en on terminal [33.21ms]
(pass) the band draws in en on desktop [36.09ms]
(pass) the band shows idle time once cold in en on desktop [23.91ms]
(pass) the band draws in en on vscode [25.21ms]
(pass) the band shows idle time once cold in en on vscode [31.06ms]
(pass) the band draws in en on mobile [42.29ms]
(pass) the band shows idle time once cold in en on mobile [27.51ms]
(pass) the band draws in ar on terminal [36.64ms]
(pass) the band shows idle time once cold in ar on terminal [42.34ms]
(pass) the band draws in ar on desktop [24.80ms]
(pass) the band shows idle time once cold in ar on desktop [23.19ms]
(pass) the band draws in ar on vscode [21.70ms]
(pass) the band shows idle time once cold in ar on vscode [24.14ms]
(pass) the band draws in ar on mobile [22.75ms]
(pass) the band shows idle time once cold in ar on mobile [22.36ms]
(pass) English is the default when no language is chosen [23.30ms]
hooks/cache.test.ts:
(pass) the last response is read from the tail, its TTL from its own write [1.85ms]
(pass) a response that only read takes the TTL of the last write [0.29ms]
(pass) a write without a TTL breakdown leaves the TTL unknown [0.47ms]
(pass) state, rebuild and keep-warm cost follow the clock and the price [1.28ms]
hooks/watch.test.tsx:
(pass) the band follows the transcript after session start [77.47ms]
(pass) a new session with no transcript yet still starts [36.93ms]
 23 pass
 0 fail
Ran 23 tests across 3 files. [0.78s]
```
