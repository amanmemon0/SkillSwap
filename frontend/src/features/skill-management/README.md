# Skill management module

Frontend implementation for category-based skill approval. It is mounted in the profile and admin screens.

## Behaviour

- Existing category skills can be selected through the profile's approved-skill picker.
- A skill outside those categories is submitted through `SkillRequestPanel`.
- While any request is `pending`, the request form is locked, so the user cannot submit another skill.
- `SkillApprovalQueue` lets an administrator approve or reject a request. Either decision removes the lock.

## Persistence

Requests are currently stored in the browser at `skillswap-skill-requests`, which allows the frontend user and admin screens to demonstrate the entire flow without changing the backend. Before deploying, replace the browser-storage operations in `api.ts` with protected API endpoints and enforce the one-pending-request rule in the backend as well; browser-side locking is not a security control.
