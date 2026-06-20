# Understand Anything Guidance

Understand Anything can help with onboarding and deep inspection across a repository.

## Use When

- A new agent or developer needs a broad orientation.
- You need to inspect unfamiliar workflows before planning.
- You want a high-level reading guide before exact source reads.

## Do Not Use When

- A simple `rg` search is enough.
- You need exact implementation truth.
- Generated output would be too large for the task.

## Install Notes

Understand Anything is installed in this repo as `likecu-understand-anything`, and its Codex skill links are installed under the user home:

```text
C:\Users\christian.paje\.agents\skills\understand*
C:\Users\christian.paje\.understand-anything-plugin
```

On Windows, the package's direct PowerShell CLI wrapper may need UTF-8 handling. If `npx understand-anything` fails with PowerShell parse errors, use the already-linked skills or rerun the installer by loading `install.ps1` as UTF-8.

## Generated Output Policy

Store generated output under `.understand-anything/` or another ignored path. Do not commit large generated analysis by default.
