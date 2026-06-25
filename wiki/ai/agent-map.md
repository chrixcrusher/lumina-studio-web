# Agent Map

## Canonical Agents

Use exactly these 8 reusable agents. Keep narrow technical concerns as skills instead of adding more agents.

| Task | Primary Agent | Supporting Agents |
| --- | --- | --- |
| Architecture, module boundaries, dataflow, tradeoffs | System Architect | Backend & Database Engineer, DevOps Engineer, Security Engineer |
| Requirements, acceptance criteria, roadmap, task coordination | Product & Planning Manager | System Architect, SQA Engineer |
| UI, UX, components, client state, accessibility | Frontend UI/UX Developer | Backend & Database Engineer, SQA Engineer, Security Engineer |
| APIs, services, persistence, integrations, batch jobs, queues, data ingestion | Backend & Database Engineer | System Architect, DevOps Engineer, Security Engineer, SQA Engineer |
| CI/CD, deployment, runtime config, automation operations, monitoring | DevOps Engineer | Security Engineer, Technical Documentation Specialist |
| Secrets, auth, authorization, dependency risk, unsafe inputs, sensitive workflows | Security Engineer | System Architect, Backend & Database Engineer, DevOps Engineer |
| Test plans, manual test cases, manual execution, regression checks, automated tests, bug reports | SQA Engineer | Relevant implementation agent |
| README, API docs, setup, operations, changelog, integration docs | Technical Documentation Specialist | System Architect, Backend & Database Engineer, DevOps Engineer, SQA Engineer |

## Skill Selection

| Workflow | Skill |
| --- | --- |
| Answer a repo question without edits | `ask-repo-question` |
| Plan a code change without edits | `plan-code-change` |
| Execute a code change | `execute-code-change` |
| Find relevant files | `use-context-tools` |
| Implement a ticket | `implement-feature` |
| Fix a defect | `fix-bug` |
| Review a patch | `code-review` |
| Add automated coverage | `write-automated-test-cases` |
| Create manual test cases | `create-manual-test-cases` |
| Execute manual test cases | `execute-manual-test-cases` |
| Update docs | `update-docs` |
| Validate API compatibility | `api-contract-check` |
| Change schema or persistence | `database-change` |
| Review security | `security-review` |
| Prepare for merge/release | `release-check` |

Additional domain capability guidance may live in role playbooks or skill folders, but `.ai/maps/agent-map.md` is the operational routing source for this project. Keep this wiki page aligned with that file when role or skill routing changes.

## Suggested Handoff Order

Feature: Product & Planning Manager -> System Architect -> relevant implementation agent -> SQA Engineer -> Security Engineer if needed -> Technical Documentation Specialist -> Release Check.

Bug: Product & Planning Manager if coordination is needed -> SQA Engineer or relevant implementation agent -> fix owner -> SQA Engineer -> Release Check.

API/data change: System Architect if cross-module -> Backend & Database Engineer -> Frontend UI/UX Developer if clients change -> API Contract Check -> SQA Engineer -> Security Engineer if needed.
