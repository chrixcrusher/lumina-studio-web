# Refactor Workflow

1. Define the behavior that must remain unchanged.
2. Use context routing and indexes to find affected files.
3. Ask System Architect for boundary or design risk when the refactor crosses modules.
4. Read exact source files and tests before editing.
5. Make small mechanical changes first, then simplify only where the codebase pattern supports it.
6. Add or update tests only when coverage is missing for the preserved behavior.
7. Run focused verification, then broader verification if shared contracts changed.
8. Update docs or maps only when ownership, architecture, commands, or workflows changed.
