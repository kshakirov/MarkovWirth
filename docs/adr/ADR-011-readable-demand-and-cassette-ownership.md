# ADR-011 — Readable demand and cassette ownership

## Context

`WirthMarkovCsvReader` adapts the worker cassette protocol to Node.js `Readable` in `objectMode`. The worker publishes borrowed views over shared byte storage and the structural index tape. The consumer must release a borrowed cassette before the worker may overwrite that storage.

The generator prototype hid control-flow suspension behind `yield`. `Readable._read()` has a different contract: Node.js may request more data again from inside `push()`, before the consumer has released the cassette that was just published.

The experiment exposed four distinct facts:

1. `_read()` may produce more than one chunk; “one `_read()`, one `push()`” is not a Node.js invariant.
2. `Atomics.waitAsync()` resolving means that a waiter was notified, not that the cassette state necessarily changed. The state must be loaded and validated after every wake-up.
3. `MAIN_TURN` expresses shared-memory ownership, but does not say whether that cassette has already been pushed to the consumer.
4. A repeated `_read()` can arrive while the current borrowed cassette is still live. Returning without a later `push()` loses pending demand; pushing a dummy chunk creates a hot demand loop.

The startup protocol also contained a false wake-up: after being given `WORKER_TURN`, the worker stored `WORKER_TURN` again and notified the reader without transferring ownership.

## Decision

The reader is modeled as a demand-and-ownership state machine rather than as a mechanical translation of the async generator.

- Only the side transferring ownership writes the other side's turn and calls `Atomics.notify()`.
- The reader gives the worker `WORKER_TURN`; the worker publishes a completed cassette by changing it to `MAIN_TURN`.
- Every wake-up is followed by an explicit state load and validation.
- A borrowed cassette is pushed at most once. Reader demand that arrives while it is still live remains pending until the consumer releases that cassette and the worker publishes the next one.
- `releaseCassette()` means only that the consumer has finished using borrowed shared memory. It must not silently redefine stream demand.
- Materialized `OWNED` data and shared-memory `BORROWED` data have different lifetime contracts.
- Natural worker completion is observed as `DESTROYED`; after all publishable data has been handled, the reader ends the Node.js stream with `push(null)`.
- A thrown parser or worker error is not treated as normal EOF and must reach stream destruction as an error.

Pending demand is kept inside the same live `_read()` invocation. `_read()` runs a state-driven loop:

1. If the current cassette has already been pushed, it waits for `MAIN_TURN` to change when the consumer releases borrowed memory.
2. It continues the loop and waits for `WORKER_TURN` to change when the worker publishes the next cassette.
3. A real `push()` or `push(null)` ends that `_read()` invocation.

When one worker cassette produces both a reconstructed `OWNED` row and a regular `BORROWED` batch, publication is treated as one ownership act. The reader marks the worker cassette as claimed before the first `push()`, publishes the prepared `OWNED` row, and then publishes `BORROWED`. A re-entrant `_read()` therefore enters the waiting branch instead of processing the same worker cassette again. The consumer releases shared memory only for `BORROWED`.

## Rationale

Stream demand and cassette ownership are independent events. Collapsing them into one Boolean or interpreting every `MAIN_TURN` as a fresh cassette duplicates data. Returning from `_read()` without arranging a future response can stall the stream. Answering with dummy chunks converts the stall into a busy loop.

Keeping the two dimensions explicit preserves zero-copy ownership, Node.js backpressure, and the worker's overwrite safety without pretending that `Readable` resumes lexically after `push()` like a generator resumes after `yield`.

## Consequences

- Demand arriving during a live borrowed cassette stays inside a two-phase `_read()` loop: wait for release, then wait for the next worker publication.
- `OWNED` and `BORROWED` results from one worker cassette are published under one pre-set claimed flag, preventing re-entrant duplicate processing.
- Tests must cover re-entrant `_read()` during `push()`, delayed release, duplicate prevention, normal EOF, early destroy, and worker failure.
- A cassette generation identifier may be added later if the Boolean ownership flag is insufficient for verification.
- The worker startup wake-up that did not transfer ownership is invalid and has been removed from the experiment.
- The current intermittent normalization failure is not resolved by this ADR and remains a separate defect.

## Status

Accepted and experimentally implemented. A full run published five `OWNED` rows and seven `BORROWED` cassettes, survived re-entrant `_read()`, reached `DESTROYED`, and exited normally. Backpressure from the return value of multiple `push()` calls remains follow-up work.
