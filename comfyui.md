# Notes for the build

- The local ComfyUI integration is now scaffolded, but not wired into any UI yet.
- Frontend Route guard now watches `initializing` so it does not flash the shell before `/me` finishes.
- ApolloClient introspection disabled on the client (`INAPOLLO_CLIENT_INTROSPECTION=disallowed`).
- Default export fix in `src/api/gql/useGetApp.ts` was applied so the hook has the expected default shape.

## ComfyUI provider API

Files:
- `backend/src/lib/media/comfyui.ts`
- `backend/src/lib/media/index.ts`
- `backend/src/lib/media/types.ts`

Behavior:
- Submits a simple default-image workflow to `{COMFYUI_BASE_URL}/prompt`.
- Waits for completion.
- Returns raw image bytes.

Notes:
- The workflow is currently conservative. It assumes standard node names (`3`, `4`, `5`, `6`, `7`, `8`, `9`).
- If the local install’s node IDs differ, update the workflow map in `comfyui.ts`.

## Frontend auth path

Files:
- `src/App.tsx`
- `src/routes.tsx`
- `src/components/RouteGuard.tsx`
- `src/hooks/useAuthInit.ts`

Behavior:
- `isAuth` now reflects the in-flight init check correctly.
- App rendering is paused until `/me` returns.

Execution on this turn is complete.
