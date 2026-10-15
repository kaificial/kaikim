export interface Project {
    id: string;
    title: string;
    description: string;
    tags: string[];
    status: 'Live' | 'Building' | 'Archived';
    url: string;
    video?: string;
    image?: string;
    solidColor?: string;
    icon?: string;
    github?: string;
    demo?: string;
    longDescription?: string;
    /** Playback trim for the preview reel (seconds). */
    startTime?: number;
    endTime?: number;
    resetTime?: number;
}

export const projects: Project[] = [
    {
        id: 'equinox',
        title: 'Equinox',
        description: 'Equinox is a full-stack tool for detecting and reducing bias in resume datasets.',
        tags: ['Python', 'Next.js', 'TypeScript', 'Three.js', 'LLMs', 'Machine Learning'],
        status: 'Building',
        url: '',
        video: '/assets/equinox.mp4',
    },
    {
        id: 'marrow',
        title: 'Marrow',
        description: 'Marrow reports outcome. It tracks every line in your repository and measures how long it survives, with human-written code as the control group.',
        tags: ['Rust', 'Python'],
        status: 'Building',
        url: '',
        video: '/assets/marrow.mp4',
    },
    {
        id: 'clairo',
        title: 'Clairo',
        description: 'AI-powered assistant to help you understand medical terminology, records, and reports with clarity.',
        tags: ['Next.js', 'TypeScript', 'WebLLM', 'Gemini', 'Transformers.js', 'IndexedDB', 'Framer Motion'],
        status: 'Building',
        url: '',
        video: '/assets/clairo.mp4',
        github: 'https://github.com/kaificial/clairo',
        demo: 'https://clairo.vercel.app',
        longDescription: `
**Clairo is a web app that helps people understand their medical reports with more clarity.**
Clairo solves this by letting you:

- **Upload any medical PDF** (blood work, pathology report, imaging results, etc.)
- **View it** in a clean and interactive reader
- **Highlight any word, phrase, sentence, etc.** and instantly get a medical definition and/or plain language explanation
- **Chat with an AI** that *read your specific document* and can answer questions like "Are any results something I should worry about?" or "What should I ask my doctor?", etc.

## Architecture
---

**Clairo has a dual AI architecture:** the user has the freedom to choose between:

| Mode | Model | Where it runs | Trade-off |
|---|---|---|---|
| **Cloud AI** | Google Gemini 2.5 Flash | Server side API route | Fast, powerful, but data leaves the browser |
| **Local AI** | Qwen 2.5 1.5B (using WebLLM) | Entirely in the browser using WebGPU | around 1GB download, slower, but **0 data transmission** |

The architecture splits into 2 independent pipelines:

**Ingestion Pipeline** → runs when a PDF is uploaded:
> PDF → extract text per page → split into around 500 char chunks → generate 384 dim embeddings → store in IndexedDB

**Query Pipeline** → runs on every user question:
> Question → embed → search vector store for similar chunks → inject top results as context → send to LLM → stream response

Both pipelines run on client side. The only server involvement is when the user chooses cloud AI, in which case the Next.js API route proxies the request to Google's Gemini.

## In-Browser RAG Pipeline
![Architecture Diagram](/assets/clairo-architecture.png)

### Cosine Similarity: The Main Search Algorithm

When a user asks a question, the app needs to find which chunks of the medical report are most *relevant* → not by keyword matching, but by the semantic meaning. "Are my cholesterol levels okay?" should match a chunk that says something like "lipid panel within reference range", or something similar.

This is done by converting both the question and every document chunk into 384 dimensional vectors, then measuring the angle between them:

$$ \\cos(\\theta) = \\frac{\\vec{A} \\cdot \\vec{B}}{\\|\\vec{A}\\|\\|\\vec{B}\\|} $$

The implementation:

\`\`\`typescript
private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];  // Dot product: how much do they point the same way?
        magA += a[i] * a[i];        // Magnitude of vector A
        magB += b[i] * b[i];        // Magnitude of vector B
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0; // Guard against zero vectors

    return dotProduct / (magA * magB); // -1 (opposite) to 1 (identical meaning)
}
\`\`\`

Then, the search method uses this implementation to rank all chunks and return the top K results above a minimum relevance threshold (the default is: 0.3):

\`\`\`typescript
public async search(queryEmbedding: number[], fileKey: string, topK = 5, minScore = 0.3) {
    const docs = await this.getDocumentsByFileKey(fileKey);

    const results = docs.map(doc => ({
        text: doc.text,
        pageNumber: doc.pageNumber,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    return results
        .filter(r => r.score >= minScore)    // Only the relevant chunks
        .sort((a, b) => b.score - a.score)   // Best matches first
        .slice(0, topK);                     // Return the top 5
}
\`\`\`

For a single document use case (1 medical report at a time), the dataset is small enough → typically 20-80 chunks → that a brute force linear scan with cosine similarity is fast enough (<5ms). Adding a dependency (something like Pinecone) would have sensitive personal data that leaves the browser, a problem that directly contradicts the privacy promise of Clairo.

### Text Chunking Strategy

PDF text is split into around 500 character chunks, always breaking on word boundaries:

\`\`\`typescript
const chunkSize = 500;
const words = pageText.split(/\\s+/);
let currentChunk = '';

for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize && currentChunk.length > 0) {
        chunks.push({ text: currentChunk.trim(), pageNumber: pageNum });
        currentChunk = word;  // Start a new chunk with the current word
    } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
    }
}
\`\`\`

| Size | Pros | Cons |
|---|---|---|
| **~200 chars** | Really precise search results | Loses paragraph level context; AI gets fragments |
| **~500 chars** | Good balance of precision and context | Little overlap in meaning between the adjacent chunks |
| **~1000+ chars** | Really good context per chunk | The embedding model only handles around 512 tokens; which **dilutes the specific details**, making the search results too basic (generic) and less precise |


## Dual AI Backend with Streaming
---

The \`ChatService\` class acts as a router. Both paths use async generators for token by token streaming, so the UI shows text in real time:

\`\`\`typescript
public async *streamResponseRAG(question: string, fileKey: string): AsyncGenerator<string> {
    // 1. Embed the user's question
    const questionEmbedding = await embeddingService.embed(question);

    // 2. Search for the most relevant doc chunks
    const relevantChunks = await vectorStore.search(questionEmbedding, fileKey, 5, 0.3);

    if (relevantChunks.length === 0) {
        yield "I couldn't find relevant information in the document...";
        return;
    }

    // 3. Format the retrieved chunks into a context string
    const context = relevantChunks
        .map((chunk, i) => \`[Excerpt \${i+1} - Page \${chunk.pageNumber}] \${chunk.text}\`)
        .join('\\n\\n---\\n\\n');

    // 4. Route to local or cloud AI
    if (!this.useLocalModel) {
        yield* apiChatService.streamResponse(question, context);
    } else {
        // Run locally via WebLLM (Qwen 2.5)
        const completion = await this.engine.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt + context },
                { role: "user", content: question }
            ],
            stream: true,
            temperature: 0.7,
        });
        for await (const chunk of completion) {
            if (chunk.choices[0]?.delta?.content) yield chunk.choices[0].delta.content;
        }
    }
}
\`\`\`

The cloud path goes through a Next.js API route that adds rate limiting (10 req/min per IP) and input validation before proxying to Google Gemini:

\`\`\`typescript
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

if (question.length > 2000) return error(400, 'Question too long');
if (context && context.length > 50000) return error(400, 'Context too large');

// Stream from Gemini back to client
const responseStream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: finalPrompt,
    config: { systemInstruction, temperature: 0.7, maxOutputTokens: 2000 }
});
\`\`\`

## Interactive Tooltip System
---

One of my favourite UX details is the context tooltip. When a user highlights any text in the PDF viewer, a floating tooltip appears with 2 options:

* **"Exact Definition"** → First queries the Merriam Webster Medical Dictionary. If there's no match, it falls back to the AI for a definition.
* **"Explain This"** → Asks the AI for a roughly 50 word plain language explanation of the selected term/phrase(s)

Both of them include a "Simplify" option that explains the output for even a 5th grader to understand.

\`\`\`typescript
const handleDefineClick = async () => {
    // Try dictionary first
    const response = await fetch(
        \`https://dictionaryapi.com/api/v3/references/medical/json/\${selectedWord}?key=...\`
    );

    if (response.ok) {
        const data = await response.json();
        if (data.length > 0 && typeof data[0] === 'object') {
            setDefinitions(data[0].shortdef.slice(0, 3));
            setSource('Merriam-Webster Medical');
            return; // Dictionary had it
        }
    }

    // Fallback: ask the AI
    const chatService = await loadChatService();
    for await (const chunk of chatService.streamResponse(aiPrompt)) {
        // ...
    }
    setSource('AI Medical Intelligence');
};
\`\`\`

## Challenges & Lessons Learned
---

**WebGPU browser support:** WebGPU is not available in Firefox or Safari. The \`ModelLoader\` component detects this and falls back to cloud only mode with a clear message.

**Context window management:** Medical reports can be 20+ pages. So dumping the entire text into an LLM context window would go past token limits and reduce the quality of answers and explanations. The chunking + RAG approach means only the 5 most relevant around 500-char excerpts get sent → roughly 2500 chars of targeted context instead of 50,000 characters of everything in the doc.

**Rate limiting on a serverless function:** The in memory \`Map\` used for rate limiting resets on cold starts, which is a known limitation of serverless. It's function for the current use cases but a production version would use Redis or Cloudflare's rate limiting.

## Future Improvements
---

* **Multi-document comparison:** Let users upload multiple reports (e.g., bloodwork from different dates) and ask "How have my levels changed?"
* **Overlap-aware chunking:** Current chunks have strict boundaries. Sliding window chunking with for example a 20% overlap would stop losing context at chunk borders.

<div style="text-align: center; margin-top: 40px; opacity: 0.6;">Last Edited: April 22, 2026</div>`,
    },

    {
        id: 'rooke',
        title: 'Rooke',
        description: 'Chess web app for beginners with sandbox and vs AI mode',
        longDescription: `

Rooke is a browser based 3D chess app for users to play chess against a custom AI engine or use a sandbox mode. Its differentiator from other chess apps is the **visual transparency of the AI**: Rooke renders the engine's internal deliberation process in real time with narrative logs and visuals. The goal of this project was to make the AI's thinking *tangible* essentially turning a normal game into a mini educational experience for newer players.

## Architecture
---

Rooke follows a **monolithic, event driven SPA** architecture with AI work offloaded to a Web Worker:

| Layer | Responsibility | Tech |
|---|---|---|
| UI | 3D scene rendering, camera controls, UI overlays (sidebar, timers, move history, AI log panel) | Three.js, GSAP, DOM manipulation |
| Game Logic | Board state, move generation, legal move validation, check/checkmate detection, special moves (castling, en passant, etc.) | TypeScript |
| AI Engine | Minimax tree search with alpha beta pruning, quiescence search, move ordering (MVV-LVA), piece square table evaluation | Web Worker (TypeScript) |
| Build / Dev | Bundling, HMR, TypeScript compilation | Vite, PostCSS, Tailwind CSS |
| Production | Static file for deployment | Express.js |

### Basic Architecture
---
![Architecture Diagram](/assets/architecture.png)

### Game Logic & Move Validation

The chess rules engine implements the full FIDE rule set for both move generation and validation.

**Move Generation:** \`getPossibleMovesRaw(piece)\` generates all pseudo legal moves for each piece type. Sliding diagonal pieces (like bishop, rook, queen) use a ray casting pattern that extends in each direction until it hits the board edge or another piece. The \`addMove\` helper handles bounds checking and capture detection returning \`false\` to stop the ray when a blocking piece is hit:

\`\`\`typescript
const addMove = (x: number, z: number) => {
    if (x < 0 || x >= 8 || z < 0 || z >= 8) return false
    const target = getPieceAt(x, z)
    if (target && target.isWhite === piece.isWhite) return false // can't capture your own teams piece
    moves.push({ x, z })
    return !target // continue if square is open -> stop if occupied
}
\`\`\`

**The Special Moves Implemented:**

- **Castling:** Validates five conditions (king/rook haven't moved, path empty, no squares under attack) and handles both kingside (O-O) and queenside (O-O-O).
- **En Passant:** Tracked using the \`lastMove\` global: if the previous move was a 2 square pawn push by the player and the current pawn is laterally adjacent then the diagonal capture is available.
- **Pawn Promotion:** When a pawn reaches the end of the other players side, a modal pauses the game. The the old pawn's 3D mesh is removed from the game and a new piece replaces it

## AI Chess Engine
---

The engine runs inside a **Web Worker** in case of any UI freezes during the game and the search. The engine is built on 3 main algorithmic concepts.

#### 1) Board Evaluation: Piece Square Tables

The evaluation function scores any board position as:

> **Score = Σ(white pieces) (Material + PST) – Σ(black pieces) (Material + PST)**

Positive = AI advantage (White) , negative = User advantage (Black). Material values follow the standard chess engine conventions:

| Piece | Value (centipawns) | Meaning |
|---|---|---|
| Pawn | 100 | Baseline unit |
| Knight | 320 | Worth ~3.2 pawns |
| Bishop | 330 | Worth ~3.3 pawns |
| Rook | 500 | Worth 5 pawns |
| Queen | 900 | Worth 9 pawns |
| King | 20,000 | Basically infinite |

On top of material counting, **Piece Square Tables** (PSTs) add positional awareness. Each piece type has a 64 element lookup table that assigns perks or penalties based on *where* the piece sits. For example, the knight PST for a knight on d4 (center) gets \`+20\`, while a knight on a1 (corner) gets \`-50\`

Tables are written from White's perspective (AI). For Black pieces, the index is mirrored (\`table[63 - i]\`), flipping the board so Black's "positive squares" are on the Black's side.

#### Minimax with Alpha Beta Pruning

The search used is a **minimax tree search**: White tries to maximize the evaluation, Black tries to minimize it, both assuming optimal moves. **Alpha beta pruning** helps to reduce the search space by tracking 2 bounds:

- **α (alpha):** the best score the maximizer is guaranteed.
- **β (beta):** the best score the minimizer is guaranteed.

When \`β ≤ α\`, the current branch is pruned:

\`\`\`typescript
function minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean) {
    nodeCount++;
    if (depth === 0) {
        return { score: quiescence(alpha, beta, isMaximizing), line: [] };
    }

    const moves = orderMoves(generateMoves(board, color), board);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            // Make move
            const saved = board[move.to];
            board[move.to] = board[move.from];
            board[move.from] = null;

            const result = minimax(depth - 1, alpha, beta, false);

            // Unmake move
            board[move.from] = board[move.to];
            board[move.to] = saved;

            if (result.score > maxEval) {
                maxEval = result.score;
                bestLine = [move, ...result.line];
            }
            alpha = Math.max(alpha, result.score);
            if (beta <= alpha) break;          // β cutoff: prune the remaining moves
        }
        return { score: maxEval, line: bestLine };
    }
    // mirrored for minimizing the user (beating them)
}
\`\`\`

**Complexity impact:** Without pruning, a depth 3 search with around 30 moves per position would be \`30³ = 27,000\` nodes. With both good move ordering and alpha beta, the effective branching factor drops to around √30 ≈ 5.5 which reduces the search to around 166 nodes: which is around a 160x speedup.

### MVV-LVA Move Ordering

To maximize the pruning efficiency itself, the moves are sorted *before* searching. The heuristic is **MVV-LVA (Most Valuable Victim – Least Valuable Attacker)**: try capturing valuable pieces with cheap attackers first.

> **score = 100 + (victimValue × 10) – attackerValue**

| Example | Formula | Score |
|---|---|---|
| Pawn captures Queen | 100 + (9×10) - 1 | **189** (highest) |
| Knight captures Queen | 100 + (9×10) - 3 | **187** |
| Pawn captures Pawn | 100 + (1×10) - 1 | **109** |
| No capture move | null | **0** (lowest) |

### Quiescence Search

At leaf nodes (depth 0), a static evaluaton could be inaccurate if some capture is still possible (called the **horizon effect**). The quiescence search fixes this by continuing to search **only capture moves** until the position is stable:

\`\`\`typescript
function quiescence(alpha: number, beta: number, isMaximizing: boolean, qDepth = 0): number {
    nodeCount++;
    const standPat = evaluate(board); // 

    if (isMaximizing) {
    if (standPat >= beta) return beta; // Already too good -> β cutoff
    if (standPat > alpha) alpha = standPat; //
        }

    if (qDepth >= 10) return standPat; // Hard depth limit

    const captures = orderMoves(generateCaptures(board, color), board);
    if (captures.length === 0) return standPat; //
    // search for only capture moves
}
\`\`\`

### Real Time AI Thought Visualization

The main unique feature of this project was the visualization of the AI deliberation in real time. Essentially, the visualization of the algorithms and methods above. 4 different systems render the AI's thinking:

**3D Arrows:** I used cyan arrows for thinking, gold for the final decision. The worker indices are converted through rank inversion (\`7 - row\`) and the board centering (\`col - 3.5\`) to the 3D environment coordinates.

**Ghost Pieces:** A wireframe clone of the actual piece follows the deliberation coordinates and uses additive blending to look like it's a hologram

**Narrative Logs:** Each AI thought is translated into a plain text sentence with heuristic analysis: capture descriptions, center control commentary, and score based sentiment (aggressive/defensive).

**Playback:** Messages from the worker are shows at around 30 messages in under 100ms. A FIFO queue (\`aiVisualQueue\`) processes 1 thought every 800ms. But if the queue goes over 20 entries, the early thoughts are ignored to keep the visualization current and (real time)

\`\`\`typescript
setInterval(() => {
    if (aiVisualQueue.length > 0) {
    if (aiVisualQueue.length > 20) {
        const lastFew = aiVisualQueue.slice(aiVisualQueue.length - 5)
        aiVisualQueue.length = 0
        aiVisualQueue.push(...lastFew)
        }
    const data = aiVisualQueue.shift()
        processAiEvent(data)
    }
}, 800)
\`\`\`

## Some Challenges & Solutions
---

### Challenge 1: The Horizon Effect in AI Evaluation

**The Problem:** The AI made some irrational moves → sacrificing pieces without benefit, or missing obvious captures → because the fixed depth 3 search evaluated positions mid capture exchange like they were final.

**Cause:** At depth 0, the original code returned a static evaluation. A position where White just captured a knight (but Black can recapture right after with a pawn) would be evaluated like if White permanently gained a knight

**The Fix:** Replaced the depth 0 static evaluation with a **quiescence search** that continues evaluating the capture only moves until the position stabilizes, with a hard depth cap of 10 in case of infinite chains.



### Challenge 2: Main Thread Blocking During AI Search

**The Problem:** Early versions ran the minimax search on the main thread. The 3D scene froze for a couple seconds during the AI's turn → no camera rotation, no animations, no UI interaction.

**The Fix:** Moved the AI engine into a Web Worker. Vite bundles the worker using \`import.meta.url\`:

\`\`\`typescript
const aiWorker = new Worker(new URL('./chess-ai.worker.ts', import.meta.url), { type: 'module' })
\`\`\`

The main thread right now sends the board state as a FEN string and gets the results asynchronously, which keeps the render loop at 60fps



### Challenge 3: AI Visualization Overwhelming the UI

**The Problem:** The AI worker has around 30 \`thinking\` messages in under 100ms. Rendering every message immediately produced a meaningless flash of overlapping UI elements

**The Fix:** Implemented a FIFO queue that plays back 1 thought every 800ms. If the queue goes past 20 entries, the early thoughts are pruned and only the final 5 are kept, to make sure the visualization is visible and not overwhelming

## Future Improvements
---

### Modular Architecture

**Currently:** monolith.

**Improvement:** Change the monolith into focused modules: \`src/scene/\` (Three.js setup), \`src/pieces/\` (geometry factories), \`src/game/\` (state management), \`src/rules/\` (move generation), \`src/ai/\` (worker integration), \`src/ui/\` (overlays), \`src/input/\` (raycaster, tap detection).

**Impact:** Better for unit testing, reduces the cognitive load, and makes the codebase more presentable at the file structure level.

### Transposition Tables & Iterative Deepening

**Currently:** The AI re-evaluates identical board positions reached using different move orders. No caching.

**Improvement:** Add **Zobrist hashing** for board hashing, store results in a transposition table (\`Map<bigint, { score, depth, flag }>\`), and use iterative deepening (search depth 1, then 2, then 3... until a given time). Use each iteration's best move as the 1st candidate for the next.

**Impact:** Around a 2-4x search speed improvement, allowing for depth 5-6 in real time.

### WebSocket-Based Multiplayer

**Currently:** Sandbox mode needs 2 people sharing one screen. There's already an Express server

**Improvement:** Add a WebSocket server with Express for room based matchmaking with shareable room codes. 

<div style="text-align: center; margin-top: 40px; opacity: 0.6;">Last Edited: April 22, 2026</div>`,
        tags: ['TypeScript', 'WebGL', 'Web Workers API', 'Three.js', 'Express.js', 'JavaScript', 'HTML5', 'CSS3 (Vanilla)', 'GSAP', 'Vite', 'PostCSS'],
        status: 'Live',
        url: 'rooke.vercel.app',
        github: 'https://github.com/kaificial/rooke',
        demo: 'https://rooke.vercel.app',
        video: '/assets/rooke.mp4'
    },
    {
        id: 'texify',
        title: 'Scribe',
        description: 'Convert handwritten math into polished LaTeX in seconds, without writing a single backslash.',
        tags: ['React', 'Vite', 'TypeScript', 'Tailwind CSS', 'Transformers.js', 'Web Workers', 'Luminance Thresholding', 'KaTeX', 'FileReader API', 'Canvas API', 'Clipboard API'],
        status: 'Live',
        url: 'https://scribelatex.vercel.app/',
        github: 'https://github.com/kaificial/texify',
        demo: 'https://scribelatex.vercel.app/',
        video: '/scribe.mp4',
        longDescription: ``,
    },
    {
        id: 'portfolio',
        title: 'Personal Portfolio',
        description: "The website you're looking at right now",
        tags: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'SCSS'],
        status: 'Live',
        url: 'kaikim.ca',
        github: 'https://github.com/kaificial/KaiKim',
        demo: 'https://kaikim.ca',
        video: '/assets/PersonalPortfolio.mp4',
        resetTime: 2,
    },
];
