# Lessons

- Keep registration separate from personalization intake: after the user clicks `Generate Roadmap`, show a registration card for email/mobile, then start Google auth. Do not mix mobile capture into the 5 roadmap questions.
- Persist a pending session before Google auth. Do not rely only on Framer overlay state across auth redirects.
- If using Supabase Edge `EdgeRuntime.waitUntil()`, treat it as async response handling, not unlimited background execution. The job is still bounded by Edge Function wall-clock/CPU limits and needs `pending/generating/complete/failed` status plus retry recovery.
- For v1, mobile remains a registration-card field after `Generate Roadmap`, not part of the 5 core roadmap questions. Google/Supabase Auth supplies verified email.
- Reminder emails are relative to roadmap creation time, not fixed weekdays: send first reminder after 3 days and second after 6 days so the copy can reference progress since generation.
- Zeno retrieval should use the wiki index as the routing map first, then fetch relevant evidence. Do not hardcode a tiny evidence-page cap that risks half-baked curriculum coverage; cap by prompt budget and relevance instead.
- Roadmap pivot: main roadmap canvas shows only 3 phases with 2-3 clickable top-level nodes each, as circle plus compact tile labels on a snake spine. Project checkpoints and subnodes appear only inside the clicked node side panel as a static expanded mini-spine; do not render checkpoints as main-canvas nodes.
