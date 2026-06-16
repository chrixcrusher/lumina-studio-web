# Caveman Concise-Output Mode

Caveman mode is an optional concise-output style for situations where short answers are more valuable than explanation.

## Use When

- The user asks for terse output.
- You are reporting command status or a short checklist.
- The task has low ambiguity and low risk.

## Do Not Use When

- Architecture, security, API contracts, or database changes need careful reasoning.
- The user needs onboarding or tradeoff explanation.
- A finding needs evidence and context.

## Install Notes

Caveman Code is installed in this repo as `@juliusbrussee/caveman-code`.

Run it through the local package binary:

```text
npx caveman --help
node_modules/.bin/caveman --version
```

Treat concise-output mode as a style choice unless the user explicitly asks to use the Caveman agent.

## Risk

Being too terse can hide assumptions. For high-risk work, prefer concise but complete explanations.
