# Agent Map

## Role Selection

| Task | Primary Role | Supporting Roles |
| --- | --- | --- |
| Coordinate multi-agent work | Project Manager | Product Manager, System Architect, SQA Engineer |
| Clarify a vague feature | Product Manager | System Architect, SQA Engineer |
| Plan a cross-module change | System Architect | Frontend, Backend, Database |
| Build UI or browser editing | Frontend Engineer | SQA, API Contract Check |
| Build API behavior | Backend Engineer | SQA, Security, API Contract Check |
| Change persistence | Database Engineer | Backend, Security |
| Add tests | SQA Engineer | Relevant implementation role |
| Change deployment/config | DevOps Engineer | Security |
| Review auth/token/upload risk | Security Reviewer | Backend, AI Integration |
| Change Hugging Face behavior | AI Integration Engineer | Backend, Frontend, Security |

## Skill Selection

| Workflow | Skill |
| --- | --- |
| Find relevant files | `use-context-tools` |
| Implement a ticket | `implement-feature` |
| Fix a defect | `fix-bug` |
| Review a patch | `code-review` |
| Add coverage | `write-tests` |
| Update docs | `update-docs` |
| Validate API compatibility | `api-contract-check` |
| Change schema or persistence | `database-change` |
| Review security | `security-review` |
| Prepare for merge/release | `release-check` |

## Suggested Handoff Order

Feature: Project Manager -> Product Manager -> System Architect -> Engineer -> SQA -> Security if needed -> Release Check.

Bug: Project Manager if coordination is needed -> SQA or Engineer -> Relevant Engineer -> SQA -> Release Check.

API/data change: Project Manager -> System Architect -> Backend/Database -> Frontend -> API Contract Check -> SQA -> Security if needed.
