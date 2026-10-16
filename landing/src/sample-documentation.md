Documentation of changes
Branch: feat/landing-page
Commit: [describe in English]

AI Instructions:
- Fill in only the "Changes made", "Testing process" and "AI Usage" fields below.
- Keep exactly the structure of this document.
- Do not include the diff blocks in the final response.
- For "AI Usage", fill in fields only with real data from the current session, if available. Never invent values — leave a field empty if the information isn't available.

- cli/main.py:
    - Changes made: [To be filled by AI]

    Diff analysed:
    ```diff
    diff --git a/cli/main.py b/cli/main.py
    index 41b5d22..36e3cfe 100644
    --- a/cli/main.py
    +++ b/cli/main.py
    @@ -20,6 +20,14 @@ def build_parser() -> argparse.ArgumentParser:
         parser.add_argument("--language", default="en", choices=["en", "pt"], help="Skeleton language")
         parser.add_argument("--title", default=None, help="Document title")
         parser.add_argument("--template", default="default", help="Template name (see templates/)")
    +    parser.add_argument(
    +        "--mode",
    +        default="working_tree",
    +        choices=["working_tree", "commit", "branch"],
    +        help="What to diff: uncommitted changes, a single commit, or a branch vs a base branch",
    +    )
    +    parser.add_argument("--commit", dest="commit_hash", default=None, help="Commit hash for --mode commit (default: HEAD)")
    +    parser.add_argument("--base", dest="base_branch", default="origin/main", help="Base branch for --mode branch")
         return parser
     
     
    @@ -34,6 +42,9 @@ def main(argv: list[str] | None = None) -> int:
             language=args.language,
             title=args.title,
             template=args.template,
    +        mode=args.mode,
    +        commit_hash=args.commit_hash,
    +        base_branch=args.base_branch,
         )
     
         print(json.dumps(result.to_dict(), indent=2, ensure_ascii=False))

    ```

Testing process:
- [To be filled by AI]

## AI Usage

- Model:
- Input tokens:
- Output tokens:
