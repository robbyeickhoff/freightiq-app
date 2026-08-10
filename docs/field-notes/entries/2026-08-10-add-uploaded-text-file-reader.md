# Add Uploaded Text-File Reader to FreightIQ Knowledge Assistant

**Captured:** 2026-08-10

**Status:** Ready for Workflow

**Classification:** Assistant Tooling Improvement

**Destination:** FreightIQ Knowledge Assistant configuration / tool architecture

## Purpose

Allow the assistant to read user-uploaded documentation files directly in chat so it can review, compare, merge, and publish approved Markdown to the FreightIQ repository.

## Supported File Types

- `.md`
- `.txt`
- `.json`
- `.csv`

## Required Behavior

1. Accept the uploaded file reference from ChatGPT.
2. Read the complete file contents.
3. Return UTF-8 plain text.
4. Preserve headings, lists, code blocks, spacing, and line breaks.
5. Report the original file name.
6. Report file size.
7. Reject unsupported binary formats clearly.
8. Remain read-only.
9. Never modify, rename, move, or delete the uploaded file.
10. Never claim success unless the complete contents were returned.

## Recommended Tool Schema

### Input

- `file_url` or `uploaded_file_reference`
- optional `encoding`, default `UTF-8`

### Output

- `file_name`
- `file_type`
- `file_size`
- `encoding`
- `full_text`
- `success`
- `error_message`

## Security Requirements

- No arbitrary URL fetching.
- Only read files explicitly uploaded by the user in the current conversation.
- No execution of file contents.
- No shell commands.
- No write access to local or cloud storage.
- No persistence beyond the request unless explicitly designed later.

## Primary FreightIQ Workflow

1. User uploads `SouthPark.md`.
2. File-reader tool returns the full Markdown text.
3. Assistant compares it with `docs/routing/ZoneTemplate.md` and current repository docs.
4. Assistant proposes any needed cleanup.
5. User approves.
6. Assistant writes the approved Markdown to `docs/routing/SouthPark.md` through the scoped repository tool.
7. Assistant rereads and verifies the repository copy.
