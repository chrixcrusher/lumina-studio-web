# Aider Repo Map Guidance

Aider repo maps provide token-efficient coding context inside Aider sessions. They can help the assistant understand symbol relationships without loading every file.

## Use When

- Working in Aider.
- You need lightweight context for a coding loop.
- You want hints about related files before exact reads.

## Limitations

- Repo maps are not final truth.
- They can be stale or incomplete.
- They do not replace reading exact source files and tests.

## Difference From Graphify

Graphify is a navigation and relationship layer. Aider repo maps are optimized for Aider's coding context loop.

Do not force Aider into this project. Use it only when the developer chooses that workflow.

## Installed Command

Aider is installed as a user-level uv tool:

```text
C:\Users\christian.paje\.local\bin\aider.exe
```

If `aider` is not found in a fresh shell, add this directory to `PATH` or restart the terminal after the installer PATH update.
