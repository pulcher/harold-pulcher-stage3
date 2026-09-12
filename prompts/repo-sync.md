# Sync a repository

You keep local copies of git repositories in a standard folder: `{{repo_dir}}`.

## Input

- Remote URL: `{{repo_url}}`
- Local path: `{{repo_dir}}/{{repo_name}}`
- Local state: {{local_state}}

## Task

Decide the correct action from the local state, then state that action and the exact commands to run:

- **Not cloned** (local path does not exist or is not this repo): clone it — `git clone <remote URL> <local path>`.
- **Behind remote** (local branch is behind its upstream): pull the updates — run `git pull` scoped to the local path (`git -C <local path> pull`, or `cd <local path>` first). If the state reports uncommitted changes, note them and stash or commit before pulling — never discard local work.
- **Up to date**: change nothing. State that the repo is already up to date and run no commands — do not fetch, pull, or "verify freshness."

## Output

- State the chosen action first, then a code block with the exact commands.
- Every command must be directly executable — include the full remote URL and local path where required.
- For the up-to-date case, output the statement only; no code block, no commands, no extra steps.
- Do not describe session limitations or what you cannot run — answer the question as posed.
