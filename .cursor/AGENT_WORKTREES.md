# Agent branches and worktrees (Cursor)

How to run Cursor’s agent in a **separate branch** so main stays clean. The “worktree dropdown” is not visible in all Cursor versions; below are options that work.

---

## Option 1: Run on a branch you create (always works)

You don’t need a worktree dropdown. Create a branch and run the agent on it:

1. In the terminal or Source Control: create and switch to a branch, e.g.  
   `git checkout -b agent/your-task-name`
2. Run the agent (Composer / Agent) as usual. It will edit **this branch**.
3. When you’re happy: merge into main (or any branch) and delete the agent branch if you like.

The agent always works on whatever branch you have checked out. So “separate branch” = switch to that branch first, then start the agent.

---

## Option 2: Parallel agents (uses worktrees automatically)

When you run **multiple agents at once** (parallel agents), Cursor puts each one in its own worktree/branch. You get an **Apply** button to bring changes into your current branch.

Where to look (depends on your Cursor version):

- **Composer / Agent panel** – Look for a control to run **2** or **3** (or more) agents instead of 1. It’s sometimes a “2x” or “3x” style button, or a “Add agent” / “Run multiple” option near the model selector or submit area.
- **Cursor 2.0** – Sidebar is “agent-centric”; check for a way to add or run multiple agents for the same prompt.
- **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) – Search for **“worktree”**, **“parallel”**, or **“agent”** to see if there’s a command to run in a worktree.

If you find a way to run 2+ agents in parallel, that mode uses worktrees and you’ll get the Apply workflow.

---

## Option 3: Settings and version check

- **Cursor Settings** – Open Settings and search for **“worktree”** or **“parallel agent”**. Some versions expose a default or option there.
- **Cursor version** – **Help → About** (or **Cursor → About Cursor**). Worktree/parallel behavior improved in 2.0; if you’re on an older build, the UI may differ or be missing.
- **Docs** – [Parallel Agents (worktrees)](https://cursor.com/docs/configuration/worktrees). The UI in the docs may not match every release.

---

## Settings already added for you

In your Cursor **User** settings:

| Setting | Value | Purpose |
|--------|--------|--------|
| `git.showCursorWorktrees` | `true` | Show Cursor-created worktrees in the Source Control pane |
| `cursor.worktreeCleanupIntervalHours` | `6` | How often old worktrees are cleaned up (hours) |
| `cursor.worktreeMaxCount` | `20` | Max worktrees per workspace (oldest removed when exceeded) |

---

## Summary

- **No dropdown?** Use **Option 1**: create a branch, switch to it, then run the agent. That’s the reliable way to “run the agent in a separate branch.”
- **Dropdown or parallel mode later?** Use that for worktrees + Apply when you see it in your version.
