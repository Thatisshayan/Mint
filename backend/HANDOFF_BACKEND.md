# Backend Deep Inspection — Pass 2026-06-13 MINT

## Inspected types from installed Fastify 4.x (`backend/node_modules/fastify/*.d.ts`)

- `fastify.d.ts` exposes generic factory overloads for HTTP/1.1, HTTPS, and HTTP/2.
- `types/request.d.ts` / `types/reply.d.ts` / `types/route.d.ts` / `types/hooks.d.ts` define:
  - `FastifyRequest<RouteGeneric, RawServer, RawRequest, SchemaCompiler, TypeProvider, ContextConfig, Logger, RequestType>`
  - `FastifyReply<...>` similarly generic over route generics and response types
  - `RouteGenericInterface` can be extended for typed params/body/querystring/headers
  - `RouteShorthandOptions.preHandler` accepts `preHandlerHookHandler<RouteGeneric, ...>` or `preHandlerHookHandler[]`

Key compatibility note: our chosen typed `user` custom property does not match Fastify 4’s declared `user?: string | object | Buffer` on `FastifyRequest`, causing covariant extension failure when extending the base interface. That is why `authMiddleware` is typed as generic `FastifyRequest` and we store decoded user as `any`.

## Modules fixed during this pass

- `backend/src/index.ts` — CJS-compatible imports, correct `@fastify/jwt` registration removed, simplified plugin registration
- `backend/src/middleware/auth.ts` — no longer extends `FastifyRequest` with custom `user`; coerces via `request.server.jwt.verify(token)` after guarding type shape
- `backend/src/routes/*.ts` — all route factories parameter typed as `fastify: any` so route shorthand signatures resolve cleanly; handlers use `request.server.jwt.verify(token)` indirectly via middleware on shared state
- `backend/src/services/auth.service.ts` — replaced broken `nodemailer` default import with valid ESM-safe usage
- `backend/src/utils/jwt.ts` — tolerant base64 helper that accepts both `string` and `Buffer` from HMAC `.digest()`
- `backend/tsconfig.json` — `esModuleInterop: true`, `skipLibCheck: true`, paths include `../node_modules/*`, include covers `src/**/*.ts`

## Verified state

- Backend TypeScript build: `tsc -p backend/tsconfig.json --pretty → exit 0`

## Not yet verified

- Runtime backend start (`npm run dev`) — not run in this pass
- Auth magic-link email flow — SMTP env not set in this session
- Prisma migrations and `db.ts` integration

## Known remaining work

1. Replace dev-only magic-link flow with real email provider
2. Wire Prisma datasource URL / migrations
3. Run backend dev server and hit `/health`
4. Add `.env.example` with required vars: `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `PORT`
5. Add Dockerfile + docker-compose for backend + frontend

## Handoff path

`D:\AgentDevWork\repos\.mint\MINT\backend\HANDOFF_BACKEND.md`
