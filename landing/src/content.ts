export const REPO_URL = "https://github.com/Paulosouzx/mcp-gen-documentation";
export const GIT_URL = `${REPO_URL}.git`;
export const AUTHOR_SITE = "https://paulosouzx.netlify.app";
export const AUTHOR_GITHUB = "https://github.com/Paulosouzx";
export const SITE_URL = "https://diffscribe.dev";

export const SITE_TITLE = "Diffscribe — Turn your Git diffs into documentation";
export const SITE_DESCRIPTION =
	"An MCP server for Claude Code that turns uncommitted changes, a commit or a whole branch into a structured Markdown documentation skeleton, ready for Claude to fill in.";

export const SECTIONS = [
	{ id: "overview", label: "Overview" },
	{ id: "how-it-works", label: "How it works" },
	{ id: "modes", label: "Modes" },
	{ id: "install", label: "Install" },
	{ id: "reference", label: "Reference" },
] as const;

export const OUTPUT_EXCERPT = `Documentation of changes
Branch: feat/landing-page
Commit: [describe in English]

- cli/main.py:
    - Changes made: [To be filled by AI]

    Diff analysed:
    \`\`\`diff
    @@ -20,6 +20,14 @@ def build_parser() -> argparse.ArgumentParser:
    +    parser.add_argument(
    +        "--mode",
    +        default="working_tree",
    +        choices=["working_tree", "commit", "branch"],

Testing process:
- [To be filled by AI]`;

export const STEPS = [
	{
		title: "You ask in plain language",
		body: "Inside any Git repository, tell Claude Code what to document.",
		code: `"Document the changes on this branch, ignoring CSS files, in Portuguese."`,
		lang: "text" as const,
	},
	{
		title: "Claude Code picks the parameters",
		body: "It translates the request into arguments for the generate_documentation tool.",
		code: `{"exclude": ["*.css"], "language": "pt"}`,
		lang: "json" as const,
	},
	{
		title: "The server writes the skeleton",
		body: "It reads the Git diffs, applies the include/exclude filters, renders a Jinja2 template and writes documentation.md.",
		code: `{
  "success": true,
  "output_file": "/path/to/documentation.md",
  "files_processed": 12,
  "files_ignored": 3
}`,
		lang: "json" as const,
	},
	{
		title: "Claude Code fills in the analysis",
		body: "It edits the file in place: “Changes made”, “Testing process” and the AI Usage fields, using only real session data.",
		code: `- Changes made: [To be filled by AI]`,
		lang: "text" as const,
	},
];

export const PRINCIPLES = [
	{
		title: "No AI API calls",
		body: "All language understanding (“ignore CSS files”, “in Portuguese”) happens in Claude Code. The server only executes structured parameters: it reads diffs, filters, renders and writes.",
	},
	{
		title: "core/ owns all logic",
		body: "cli/ and mcp_server/ are thin adapters that call core.generator.generate_documentation() and format its result. All Git commands live in core/git_diff.py.",
	},
	{
		title: "Skeleton, not final prose",
		body: "Diffs are embedded next to [To be filled by AI] placeholders. Claude Code then edits the output file directly to write the actual analysis.",
	},
];

export const MODES = [
	{
		id: "working_tree",
		tag: "default",
		title: "Uncommitted changes",
		body: "Staged + unstaged changes. When a file has both, the staged diff takes priority.",
		git: "git diff --cached  ·  git diff",
		prompt: "Document the changes on this branch, ignoring CSS files, in Portuguese.",
		json: `{"exclude": ["*.css"], "language": "pt"}`,
		note: "mode omitted — defaults to \"working_tree\".",
	},
	{
		id: "commit",
		tag: "single commit",
		title: "One commit",
		body: "Everything a single commit introduced. Without commit_hash it documents HEAD.",
		git: "git diff-tree -p --root <commit>",
		prompt: "Document what changed in commit a1b2c3d.",
		json: `{"mode": "commit", "commit_hash": "a1b2c3d"}`,
		note: "“Document the last commit.” → {\"mode\": \"commit\"}",
	},
	{
		id: "branch",
		tag: "whole branch",
		title: "A whole branch",
		body: "The current branch against the merge-base of a base branch (three-dot diff).",
		git: "git diff <base_branch>...HEAD",
		prompt: "Document everything this branch adds compared to origin/develop.",
		json: `{"mode": "branch", "base_branch": "origin/develop"}`,
		note: "base_branch omitted — defaults to \"origin/main\".",
	},
];

export const ONLINE_STEPS = [
	{
		title: "Install uv",
		body: "uvx runs Python tools straight from a Git URL. uv can also provide Python 3.10+ if you don't have it.",
		code: "curl -LsSf https://astral.sh/uv/install.sh | sh",
		label: "terminal",
	},
	{
		title: "Register the server with Claude Code",
		body: "At user scope, so it's available in every project. On first launch uvx downloads the package from GitHub and caches it.",
		code: `claude mcp add --scope user --transport stdio gendoc -- \\
  uvx --from git+${GIT_URL} gendoc-mcp-server`,
		label: "terminal",
	},
	{
		title: "Check it's connected",
		body: "Or run /mcp inside a Claude Code session.",
		code: "claude mcp list",
		label: "terminal",
	},
];

export const LOCAL_STEPS = [
	{
		title: "Clone and install",
		body: "Requires Python 3.10+. Installs the gendoc-mcp (CLI) and gendoc-mcp-server (MCP server) scripts into .venv/bin/.",
		code: `git clone ${GIT_URL}
cd mcp-gen-documentation
python3 -m venv .venv
source .venv/bin/activate
pip install -e .`,
		label: "terminal",
	},
	{
		title: "Register the server with Claude Code",
		body: "Use the absolute path to the script. Running it from inside the cloned folder, \"$PWD\" fills that in for you.",
		code: `claude mcp add --scope user --transport stdio gendoc -- \\
  "$PWD/.venv/bin/gendoc-mcp-server"`,
		label: "terminal · inside mcp-gen-documentation/",
	},
	{
		title: "Check it's connected",
		body: "Or run /mcp inside a Claude Code session.",
		code: "claude mcp list",
		label: "terminal",
	},
];

export const PARAMS = [
	["project_path", "string", "server cwd", "Git repository to analyze"],
	["include", "string[]", "none (= all)", "Glob patterns; only matching changed files are kept"],
	["exclude", "string[]", "none", "Glob patterns to drop, applied after include"],
	["output_file", "string", "documentation.md", "Output path, relative to project_path unless absolute"],
	["language", "\"en\" | \"pt\"", "\"en\"", "Skeleton language"],
	["title", "string", "language default", "Document title"],
	["template", "string", "\"default\"", "Template name, resolved as templates/{template}_{language}.md.j2"],
	["mode", "\"working_tree\" | \"commit\" | \"branch\"", "\"working_tree\"", "Diff source"],
	["commit_hash", "string | null", "null (= HEAD)", "Commit to document, used when mode=\"commit\""],
	["base_branch", "string", "\"origin/main\"", "Base branch to diff against, used when mode=\"branch\" (base_branch...HEAD)"],
] as const;

export const RETURN_JSON = `{
  "success": true,
  "output_file": "/path/to/documentation.md",
  "files_processed": 12,
  "files_ignored": 3
}`;

export const CLI_COMMANDS = `# Uncommitted changes (default mode)
gendoc-mcp
gendoc-mcp --mode working_tree --exclude "*.css" --language pt

# A specific commit (defaults to HEAD if --commit omitted)
gendoc-mcp --mode commit --commit a1b2c3d

# Current branch vs a base branch (defaults to origin/main)
gendoc-mcp --mode branch --base origin/develop`;

export const CLI_ONLINE = `uvx --from git+${GIT_URL} gendoc-mcp --mode commit`;

export const CLI_FLAGS = [
	["--project-path", "Path to the Git repository (default: cwd)"],
	["--include / --exclude", "Glob patterns, e.g. *.py src/* or *.css"],
	["--output-file", "Output Markdown file path"],
	["--language", "en or pt"],
	["--title / --template", "Document title · template name (see templates/)"],
	["--mode", "working_tree, commit or branch"],
	["--commit", "Commit hash for --mode commit (default: HEAD)"],
	["--base", "Base branch for --mode branch (default: origin/main)"],
] as const;
