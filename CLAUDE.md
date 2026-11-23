# TrashCanned

## Required: mattpocock skills

This project's workflow runs on the `mattpocock-skills` plugin. Before any work, check that its skills (`mattpocock-skills:grilling`, `mattpocock-skills:code-review`, `mattpocock-skills:pr`) are available. If they are missing, stop and tell the user to run `/plugin install mattpocock-skills@claude-plugins-official`.

Issue tracker: Jira project **KAN** (Atlassian MCP). Tickets are `KAN-<n>`; branches are `feat/KAN-<n>-<slug>`.

## Workflow

Every ticket goes through these steps in order. Each step ends on its completion criterion; move on only when it holds.

1. **KAN** — Fetch the ticket with the Atlassian MCP and state its title. Create the branch from `main`.
   Done: ticket read, branch checked out.
2. **Grill** — Invoke `mattpocock-skills:grilling` on the ticket. One question at a time, numbered (Q1, Q2…). If the scope outgrows the ticket's estimate, propose new KAN tickets and create them once the user agrees.
   Done: every open design decision has the user's answer.
3. **PRD** — Ask the user to type `/to-spec` (user-only skill). The spec goes into the KAN ticket.
   Done: spec published on the ticket.
4. **Code** — Implement the spec. Use `mattpocock-skills:tdd` for new logic.
   Done: every user story in the spec is covered and the tests pass.
5. **Commit** — Commit at each logical milestone during step 4, not as one batch at the end. Conventional Commits with the ticket: `feat(simulator): KAN-48 …`.
   Done: every change committed, working tree clean.
6. **Review** — Invoke `mattpocock-skills:code-review` with `main` as the fixed point. Fix the real findings, one commit each.
   Done: no open findings on either axis (Standards, Spec).
7. **Decisões** — Record the ticket's decisions in `Phase 3/Resources/TrashCanned_Fase3_Decisoes.md`, in Portuguese, following the file's existing section format (`## N. Título`, then `*KAN-<n> · YYYY-MM-DD*`, then **Porquê:**). Markdown only. Commit it.
   Done: every decision from step 2 is in the file.
8. **PR** — Write the body with `mattpocock-skills:pr`. The user approves each `git push` and `gh pr create`; ask before running them.
   Done: PR open against `main`, link given to the user.
