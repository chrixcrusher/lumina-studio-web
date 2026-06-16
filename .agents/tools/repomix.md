# Repomix Guidance

Repomix can package repository content into a portable snapshot for sharing with AI tools.

## Useful When

- Moving context between tools.
- Sharing a controlled subset of repo files.
- Creating an offline review artifact.

## Token Cost Risk

Snapshots can be very large and less token-efficient than targeted file reads. Prefer exact searches and selected files for normal coding work.

## Do Not Use When

- The task touches only a small set of known files.
- Generated output would include secrets, logs, build artifacts, or dependencies.
- A graph or snapshot would replace exact source reading.

Keep `repomix-output.*` ignored unless explicitly reviewed for commit.
