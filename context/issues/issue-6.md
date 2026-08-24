# Issue #6 — Refactoring Core Parser Engine to Stateful Closure Automaton (Chunked/Byte Processing)


**State:** OPEN
**Author:** @kshakirov
**Created:** 2026-08-20T09:44:30Z
**Updated:** 2026-08-20T09:57:03Z
**URL:** https://github.com/kshakirov/MarkovWirth/issues/6

---



**Type:** Refactoring / Architecture

**Scope:** `lib/parser/`

**Milestone:** v0.4.0 High-Throughput Streaming Baseline

#### **Context & Goal**

Current `WirthCsvParserFlat` implementation operates as a pure stateless function over an entire pre-allocated input buffer. While high-performing, this approach forces holding entire datasets in memory (up to 131MB+). To support arbitrary file sizes with a constant memory footprint (O(1) space complexity), the lexer/parser loop must be refactored into a **stateful finite state machine (FSM)** capable of processing inputs byte-by-byte or chunk-by-chunk without losing state across buffer boundaries.

#### **Technical Requirements**

1. **Zero-OOP Architecture:** Avoid classes, `this` context, and `new` instantiations in hot loops to eliminate V8 hidden class overhead and garbage collection pauses.
2. **Closure-Driven State Management:** Encapsulate parsing state (`state`, `cellBuf`, `cellLen`, `currentRow`) within a factory closure.
3. **Chunk Boundary Resilience:** Maintain quote state (`IN_QUOTES`) and partial cell buffers seamlessly when a chunk ends mid-token or mid-string.
4. **Streaming Execution Loop:** Replace growing memory buffer with a fixed-size static reading cassette (`Buffer.allocUnsafe(64000)`).

#### **Acceptance Criteria**

* [ ] Core parser refactored to closure-based stateful FSM.
* [ ] Memory allocation remains constant (O(1)) during 1GB+ CSV file processing.
* [ ] Passage of all existing integration tests (including multi-line quoted values and escaped quotes).
* [ ] Zero usage of `Buffer.concat` inside processing loops (adherence to ADR-008).






### **[APPENDIX A] Zero-Copy Output Contract (Layout Index Mapping)**

#### **Rationale & Motivation**

Creating JS string primitives (`Buffer.toString('utf8')`) and allocating row arrays (`string[]`) for millions of cells introduces extreme Garbage Collection overhead and defeats the low-level hybrid design (ADR-008).

Since the downstream consumer and our **NAM Oracle (Markov Engine)** process bytes lazily and expect raw data, the stateful FSM will NOT reconstruct or slice strings. Instead, it operates strictly as a **Structural Indexer**.

#### **Output Data Structure**

The parser outputs a raw flat TypedArray (e.g., `Int32Array`) containing cell boundaries and row terminators relative to the stream or buffer offsets:

* **Cell Entry:** `[start_offset, length]`
* **Row End Marker:** Special control sentinel `[-1, -1]` (or `ROW_TERMINATOR_FLAG`).

```text
Raw Buffer:  [ E 0 1 0 0 3 7 7 4 , R e d b r i d g e , B u r g l a r y \n ]
Int32Array:  [ 0, 9,  10, 9,  20, 8,  -1, -1 ]
               │  │    │   │    │   │   └─► End of Row
               │  │    │   │    └───┴─────► Cell 3: "Burglar" (off: 20, len: 8)
               │  │    └───┴──────────────► Cell 2: "Redbridge" (off: 10, len: 9)
               └──┴───────────────────────► Cell 1: "E01003774"  (off: 0, len: 9)

```

#### **Core Advantages**

1. **Zero-Allocation Execution:** $O(1)$ memory consumption. No `string` objects or dynamic `Array` allocations during the scanning phase.
2. **Decoupled Normalization:** The FSM handles physical boundary detection at high speed. Cell unescaping (`""` $\rightarrow$ `"`) is deferred to the **NAM Oracle**, which processes only the specific byte slices requested by the caller.
3. **Lazy Column Evaluation:** Downstream consumers needing only specific columns (e.g., column #2 and #5) read directly from the offsets, skipping UTF-8 decoding for the remaining columns.

#### **Updated Acceptance Criteria**

* [ ] FSM returns a flat `Int32Array` or pre-allocated index buffer instead of JS arrays/strings.
* [ ] Zero invocations of `.toString()` or `Buffer.subarray()` within the main scanning loop.
* [ ] Consumer interface updated to lazily resolve values via the Index Map.

-

---

## Comments

