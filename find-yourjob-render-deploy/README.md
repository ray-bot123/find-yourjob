# find yourjob

Turn a career you want into evidence you can build.

An English web prototype for career changers: resume-grounded choices, live US job discovery, personalized Study Roads, PayPal Sandbox membership, daily assignments, GitHub README evidence reviews and a candidate-reviewed resume draft.

## Run a working local build

Prerequisites: Node.js 22+, Python 3.11+, internet access, a configured AI service and PayPal Sandbox REST app with an active subscription plan. Adzuna is optional for live US jobs; illustrative role types remain available.

1. In this directory run `python -m pip install -r requirements.txt` (use `python3` on systems where needed).
2. Copy `ai.example.json` to `ai.local.json`, `paypal.example.json` to `paypal.local.json`, and optionally `adzuna.example.json` to `adzuna.local.json`. Fill only the local copies. Never commit credentials.
3. AI configuration uses a Chat Completions JSON-compatible endpoint; the tested provider is DeepSeek. PayPal must use Sandbox credentials and an ACTIVE plan ID. Its trial/pricing terms are read from PayPal; do not assume any price without inspecting them.
4. Run `node run.mjs`. If necessary set the `PYTHON` environment variable to your Python executable path. Alternatively launch `node server.mjs`, `python resume_service.py`, and `python ai_service.py` in separate terminals.
5. Open **http://localhost:4175/#/discover**. Keep this hostname consistent. Stop with Ctrl+C.

All services bind loopback: web 4175, document parser 4177, AI 4178. This is a local test build, not a static-hosting deployment. Ensure these ports are free. No npm dependencies or compilation step are needed.

## Judge walkthrough

Use the fictional profile in `DEMO-RESUME.txt`, not private personal data. Confirm it, run AI analysis and select work/location/style preferences. Explore directions and a job or role type. Save it and reload to check persistence. Open Study Road and inspect gaps and deliverables. In Discover choose Add to plan, duration and weekly study hours. Read Sandbox terms, start checkout, approve using a separate PayPal Sandbox Personal buyer, return and verify. Never use a real payment account for this test.

My plan opens a dedicated page with milestones and calendar. Generate a daily assignment, export calendar reminders and submit a public GitHub repository with a substantive README. Review is based only on README content, not executed code or linked files. Completed milestones unlock a factual resume draft to review and download. Open application links lead to the external posting; the app does not submit applications automatically.

No Sandbox buyer credentials are bundled. The submitter must supply a dedicated test buyer and free access instructions through the private judging channel before submission. Merchant and AI secrets must never go into the public repository. The public source alone does not satisfy free judge access until those arrangements are complete.

## Tests and verification boundary

Run `node --test tests/*.test.mjs` and `python -m unittest test_ai_service`. Thirteen Node tests and four Python validation tests passed in the development environment. Live checks covered resume options, Adzuna listings, Study Road generation, checkout creation and unauthenticated member rejection. Restart persistence uses simulated PayPal responses. Active buyer approval and the complete active-member cycle remain acceptance gates; do not represent them as already passed.

## Architecture and privacy

Native JS frontend → loopback Node server → PayPal Sandbox/Adzuna. Member AI requests use a same-origin Node proxy; Python independently verifies active subscription through the local PayPal service before model work. Public resume analysis is separate. PayPal subscription associations persist in ignored `paypal-sessions.local.json`; reset disconnects the local association, not the PayPal subscription. Cancellation is handled through PayPal, and member requests recheck status.

Resume/profile/plans are saved in browser storage, not a cloud account. Original document bytes are parsed in memory. AI processing sends confirmed resume and relevant work to the configured provider. GitHub review fetches a public README. The built-in sample profile intentionally does not persist as a real profile; paste the supplied fictional text to test persistence. Settings can clear local user data.

## Scope and honest limitations

No cloud login, email/push reminder service, automatic application submission, hiring probability, or guaranteed offer. Calendar export requires import into a calendar. Community stories and local posts are illustrative and not a shared production forum. LinkedIn links are searches, not LinkedIn API data. Live Adzuna coverage is US only. A shorter study duration does not guarantee readiness. Financial testing is Sandbox only.

## License and assets

Project source is MIT licensed; see LICENSE. Third-party services and dependencies retain their own terms. Generated concept photographs and original code-native illustrations are included; Google Fonts has system fallbacks. See THIRD-PARTY.md. Review asset provenance before public submission.
