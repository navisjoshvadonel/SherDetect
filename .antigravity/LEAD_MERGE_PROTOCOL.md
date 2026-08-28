# Team Lead Pull Request Review Protocol

When a teammate opens a PR:
1. Verify that GitHub Actions CI Pipeline is passing (Green Checkmark).
2. Check file paths changed:
   - Frontend Lead must only modify `frontend/`
   - Backend Lead must only modify `backend/`
   - AI Specialist must only modify `ai_engine/`
   - Pitch/QA Lead must only modify `demo_assets/` or `docs/`
   - `contracts/` MUST NEVER BE MODIFIED WITHOUT LEAD CONSENT.
3. Merge using GitHub "Squash and merge".
4. Broadcast sync command: `git checkout main && git pull origin main && git checkout <branch> && git merge main`
