# SkillSwap City — Frontend

This folder is the complete frontend application owned by the client team. It is intentionally isolated from backend, database, and deployment concerns.

```bash
npm install
npm run dev
```

Mock data lives in `src/data/`; replace it with service adapters when the backend contract is ready.

## Demo sign-in

| Role | Email | Password | Destination |
| --- | --- | --- | --- |
| Member | `user@skillswap.city` | `User@123` | Member dashboard |
| Admin | `admin@skillswap.city` | `Admin@123` | Admin dashboard |

The demo session uses browser `localStorage` only. It is not a secure authentication implementation and should be replaced by the backend team's real auth integration.
