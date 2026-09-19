# GPT Researcher WS Protocol Spike — Notes

**Status: SKIPPED (not run).**

## What happened

Task 0 of `docs/superpowers/plans/2026-09-19-gpt-researcher-integration.md` calls for
running a live GPT Researcher server locally and capturing its real WebSocket message
log. Attempting this:

1. Confirmed Python 3.9/3.10/3.11/3.12 are all available on this machine.
2. Ollama was not running. Started it (`ollama serve`) — it logged
   `Listening on 127.0.0.1:11434` then hung: a `llama-server GPU discovery watchdog
   timed out` warning appeared ~90s later and no further log output occurred. The
   process accepted TCP connections but never responded to `GET /api/tags` (confirmed
   with `curl -v`, which showed the request fully sent and zero bytes received after a
   10s timeout).
3. Killed and restarted with `OLLAMA_VULKAN=0 CUDA_VISIBLE_DEVICES=-1` to skip GPU
   discovery entirely. Same symptom: port bound, TCP connects, HTTP request sent, no
   response — this time with no log output at all before the timeout.
4. Killed the second hung process. Did not proceed further (installing GPT Researcher
   itself was never reached, since it needs a working Ollama to synthesize with).

This reproduces independently of anything in this integration's own code — it's an
Ollama/GPU-driver-level issue on this specific machine, unrelated to MINT or GPT
Researcher.

## Decision

Per the user's explicit choice, the spike was skipped rather than continuing to
troubleshoot Ollama indefinitely. Implementation proceeded on Task 3's documented
"most likely" assumption about GPT Researcher's completion protocol (fetch the JSON
output file over HTTP from the running server after receiving the final `"type":
"path"` WebSocket message), which was itself already grounded in real source reads of
GPT Researcher's `websocket_manager.py` and `server_utils.py` (not a blind guess — see
the design spec's Architecture section for what was actually confirmed vs. assumed).

## What's still unverified

- Whether the GPT Researcher FastAPI server actually serves its `outputs/` directory
  as static files reachable over plain HTTP (Task 3's `fetchCompletion()` assumes
  `GET {baseUrl}{jsonPath}` works).
- Whether the server ever streams a `"type": "report"` message with inline markdown
  during generation (would allow live-rendering the report as it's written, rather
  than only receiving it at the very end).
- The exact real values GPT Researcher accepts for `tone` and `report_type` in
  practice (Task 3 uses `tone: "Analytical"` and `report_type: "research_report"`,
  both confirmed as valid field *names* from source, but not exhaustively tested).

## Resume hint

Once Ollama is confirmed working on this or another machine (`curl
http://localhost:11434/api/tags` returns promptly), re-run Task 0's steps from
`docs/superpowers/plans/2026-09-19-gpt-researcher-integration.md` and update this file
with real findings. If `fetchCompletion()` in
`backend/src/services/ai/gptResearcher.service.ts` turns out to need a different
approach, that's the one thing in this integration most likely to need a follow-up
fix — everything else (the streaming route, fallback logic, UI) doesn't depend on
GPT Researcher's exact completion-delivery mechanism.
