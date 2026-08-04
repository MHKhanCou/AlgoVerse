# AlgoVerse V2 — Visualization System Audit

> Comprehensive review of current visualization methods, issues, and recommendations

---

## 1. Current Architecture Overview

### Engine Layer
```
engine/playback.js     → GSAP Timeline for step-by-step animation
engine/state.js        → Zustand store for visualization state
engine/keyboard.js     → Keyboard shortcuts (Space, arrows, R, +/-)
```

### Algorithm Step Generators
```
engine/algorithms/sorting.js    → 6 algorithms (Bubble, Selection, Insertion, Merge, Quick, Heap)
engine/algorithms/searching.js  → 4 algorithms (Linear, Binary, Jump, Exponential)
engine/algorithms/graph.js      → 7 algorithms (BFS, DFS, Dijkstra, Prim, Kruskal, TopoSort, A*)
engine/algorithms/dp.js         → 4 algorithms (Fibonacci, Knapsack, LCS, CoinChange)
engine/algorithms/recursion.js  → 3 algorithms (Fibonacci, Factorial, TowerOfHanoi)
engine/algorithms/string.js     → 2 algorithms (KMP, RabinKarp)
engine/algorithms/tree.js       → 2 algorithms (BST Insert, Heap Insert)
```

### Renderers
```
renderers/ArrayRenderer.jsx     → Canvas-based array visualization (bars/dots/lines)
renderers/GraphRenderer.jsx     → React Flow graph visualization
renderers/DPTableRenderer.jsx   → DOM-based DP table (2D grid)
renderers/TreeRenderer.jsx      → SVG-based binary tree
renderers/GraphEditor.jsx       → Interactive graph editor (not a renderer)
```

### UI Components
```
engine/PlaybackControls.jsx    → Play/Pause/Step/Reset/Speed
engine/StepTimeline.jsx        → Visual step markers
engine/StepDescription.jsx     → Current step text
engine/StatsPanel.jsx          → Algorithm metrics
engine/StatePanel.jsx          → Algorithm-specific state
editors/CodeEditor.jsx         → Monaco Editor with line highlighting
```

---

## 2. Per-Algorithm Visualization Analysis

### Sorting Algorithms (6)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| Bubble Sort | ✅ | ArrayRenderer (bars) | Works correctly |
| Selection Sort | ✅ | ArrayRenderer (bars) | Works correctly |
| Insertion Sort | ✅ | ArrayRenderer (bars) | Works correctly |
| Merge Sort | ✅ | ArrayRenderer (bars) | Should show recursive tree for better understanding |
| Quick Sort | ✅ | ArrayRenderer (bars) | Works correctly |
| Heap Sort | ✅ | ArrayRenderer (bars) | Should show heap tree for better understanding |

**Issues:**
- Merge Sort and Heap Sort should ideally show tree/recursive structure, not just bars
- No visualization of the merge process (comparing elements from two halves)
- No visualization of heapify operations

### Searching Algorithms (4)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| Linear Search | ✅ | ArrayRenderer (bars) | Works correctly |
| Binary Search | ✅ | ArrayRenderer (bars) | Works correctly |
| Jump Search | ✅ | ArrayRenderer (bars) | Works correctly |
| Exponential Search | ✅ | ArrayRenderer (bars) | Works correctly |

**Issues:**
- Search algorithms show sorted array even when user input is unsorted (correct behavior but might confuse users)
- No highlighting of the search range (left/right pointers)

### Graph Algorithms (7)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| BFS | ✅ | GraphRenderer | Works, but no path edge highlighting |
| DFS | ✅ | GraphRenderer | Works, but no backtrack visualization |
| Dijkstra | ✅ | GraphRenderer | Works, but no distance labels |
| Prim | ✅ | GraphRenderer | Works, but no MST edge highlighting |
| Kruskal | ✅ | GraphRenderer | Works, but no cycle detection visualization |
| Topological Sort | ✅ | GraphRenderer | Works, but no in-degree visualization |
| A* | ✅ | GraphRenderer | Works, but no heuristic visualization |

**Issues:**
- **ReactFlow crash**: `Cannot read properties of undefined (reading 'x')` — node position issue
- **Edge errors**: "Couldn't create edge for source handle id: null" — edges need proper source/target
- **No path edge highlighting**: When algorithm finds a path, edges should be highlighted
- **No node state transitions**: Nodes don't visually transition between states
- **No distance/weight labels**: Graph edges don't show weights during execution
- **No start/end node selection**: Users can't choose start/end nodes for graph algorithms

### DP Algorithms (4)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| Fibonacci DP | ✅ | DPTableRenderer | Works correctly |
| Knapsack | ✅ | DPTableRenderer | Fixed — see note below |
| LCS | ✅ | DPTableRenderer | Fixed — see note below |
| Coin Change | ✅ | DPTableRenderer | Works correctly |

**Fixed (previously rendered blank):** step generators emit a 2D `dpTable`
(array of rows) while `DPTableRenderer` indexed it flat as `dpTable[r*cols+c]`,
so every 2D cell resolved to `undefined` and Knapsack/LCS drew an empty grid.
The renderer now flattens row arrays before indexing. Covered by
`__tests__/renderers.test.jsx`.

**Issues:**
- DPTableRenderer shows flat array mapped to 2D grid (indices mapped to row/col)
- No proper DP table visualization with row/column headers
- No transition arrows showing how values are computed
- No backtracking visualization for Knapsack/LCS

### Recursion Algorithms (3)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| Fibonacci | ✅ | ArrayRenderer (bars) | Should show recursion tree |
| Factorial | ✅ | ArrayRenderer (bars) | Should show recursion tree |
| Tower of Hanoi | ✅ | ArrayRenderer (bars) | Should show peg/disk visualization |

**Issues:**
- Recursion algorithms show array bars instead of recursion tree
- No visualization of the call stack
- No visualization of backtracking

### String Algorithms (2)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| KMP | ✅ | ArrayRenderer (bars) | Should show text with pattern highlighting |
| Rabin-Karp | ✅ | ArrayRenderer (bars) | Should show rolling hash visualization |

**Issues:**
- String algorithms show array bars instead of text visualization
- No pattern matching visualization
- No hash calculation visualization

### Tree Algorithms (2)

| Algorithm | Steps | Visualization | Issues |
|-----------|-------|---------------|--------|
| BST Insert | ✅ | TreeRenderer | Works correctly |
| Heap Insert | ✅ | TreeRenderer | Works correctly |

**Issues:**
- TreeRenderer is basic — only shows binary tree with nodes
- No animation of node insertion
- No visualization of tree balancing

---

## 3. Critical Issues Summary

### A. ReactFlow Crash (Graph Algorithms)
**Error**: `Cannot read properties of undefined (reading 'x')`
**Cause**: GraphEditor/GraphRenderer nodes may have missing position properties
**Status**: Fixed in GraphEditor (position: {x, y} format), but GraphRenderer may still have issues
**Fix needed**: Verify GraphRenderer node format matches ReactFlow v12 requirements

### B. Edge Errors
**Error**: "Couldn't create edge for source handle id: null"
**Cause**: Edges reference non-existent nodes or have invalid source/target
**Fix needed**: Validate edge data before rendering

### C. DP Table Renderer
**Status**: ✅ Fixed. 2D `dpTable` snapshots are flattened before indexing, so
Knapsack/LCS render real values instead of blank cells.
**Remaining**: no transition arrows, no backtracking visualization.

### D. String Renderer
**Current**: String algorithms show array bars
**Issue**: No text visualization for pattern matching
**Fix needed**: Create StringRenderer with text highlighting for KMP/Rabin-Karp

### E. Recursion Visualization
**Current**: Recursion algorithms show array bars
**Issue**: No recursion tree, no call stack visualization
**Fix needed**: Enhance TreeRenderer for recursion trees, add call stack display

### F. Oversized Slider
**Issue**: UI components overflow or have visual issues
**Fix needed**: CSS overflow fixes, responsive sizing

### G. Text Inconsistencies
**Issue**: Some labels/text don't match algorithm type or content
**Fix needed**: Review and fix all text labels

### H. Path Finding Visualization
**Status**: ✅ Fixed. `GraphRenderer` handled `pathEdges` only inside an
`if (s.edge)` guard, but `path` steps (Dijkstra/Prim/Kruskal results) carry no
`.edge`, so result edges were never highlighted. The `path` branch now runs
independently.

---

## 4. Recommendations

### Immediate Fixes (Phase 1)
1. Fix ReactFlow crash by verifying node positions
2. Fix edge errors by validating edge data
3. Fix oversized slider CSS
4. Fix text inconsistencies

### Short-term (Phase 2)
1. Create proper DP table renderer with headers and transitions
2. Create StringRenderer for pattern matching visualization
3. Enhance TreeRenderer for recursion trees
4. Add path edge highlighting for graph algorithms

### Medium-term (Phase 3)
1. Add call stack visualization for recursion
2. Add backtracking visualization for DP
3. Add distance labels for Dijkstra
4. Add MST edge highlighting for Prim/Kruskal
5. Add heuristic visualization for A*

### Long-term (Phase 4)
1. Create interactive graph editor for all graph algorithms
2. Add algorithm comparison mode
3. Add dry-run mode
4. Add video export capability

---

## 5. Code Quality Issues

### Performance
- ✅ Fixed: `ArrayRenderer` reallocated the canvas backing store and called
  `getComputedStyle` on *every* animation frame, and ran a `requestAnimationFrame`
  loop that re-painted identical frames. It now resizes only on actual size
  change, resolves colors once per theme, and draws once per state change.
- `getArrayState()` still replays all steps from index 0 on each render, which is
  O(steps) per frame. Fine at current step counts; would need incremental state
  or periodic snapshots to scale.
- GraphRenderer recalculates node states on every render

### Algorithmic accuracy
- ✅ Fixed: Dijkstra and A* used `array.sort()` on every pop, contradicting the
  advertised O((V + E) log V). Both now use a binary min-heap, verified against
  a Bellman-Ford reference over 25 random graphs in
  `__tests__/dijkstra-heap.test.js`.

### Security
- ✅ Fixed: `AlgorithmDetailV2` rendered `algorithm.explanation` through
  `dangerouslySetInnerHTML` with no sanitizer. The page it replaced
  (`SingleAlgorithm.jsx`) did call `DOMPurify.sanitize`, so the V2 rewrite
  regressed it. Sanitization restored.

### Maintainability
- 5 separate visualizer components with duplicated logic
- No shared animation engine
- No shared control panel
- Inconsistent CSS across components

### Testing
- 60 tests: step generators, plus renderer/engine regression tests added after
  the bugs above (every one of which lived in the renderer/engine seam that the
  original generator-only suite could not reach)
- No integration tests for the visualization system
- No snapshot tests for UI components

### Dead code
- `ComparisonView.jsx` and `GridRenderer.jsx` are complete but imported nowhere.
  `GridRenderer` is a working maze/wall editor that needs grid-based step
  generators before it can be wired up; `ComparisonView` needs a comparison
  route. Both are kept deliberately, not accidentally.
- (`StepTimeline` and `StatePanel` *are* live — they are used via
  `VisualizationLayout`.)

---

## 6. Summary

| Category | Current State | Target State |
|----------|--------------|--------------|
| Sorting | ✅ Working | Add recursive tree for Merge/Heap |
| Searching | ✅ Working | Add range highlighting |
| Graph | ⚠️ Partial | Fix ReactFlow crash, add path highlighting |
| DP | ⚠️ Partial | Create proper DP table renderer |
| Recursion | ⚠️ Partial | Create recursion tree renderer |
| String | ⚠️ Partial | Create text highlight renderer |
| Tree | ✅ Working | Enhance with animation |

**Overall**: the ✅ marks in the tables above originally recorded "a step
generator exists", not "the visualization renders correctly". Several rows
marked "Works correctly" were rendering blank or unhighlighted. Verify against
the test suite rather than this table.
