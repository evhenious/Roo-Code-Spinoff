# Roo Code Distilled Changelog

## 1.0.3

- new tool `notify`, allows assistant to quickly end it's turn in convo without any summaries or results.
- `ask` mode has read-only git access (git status etc).
- `ask_followup_question` tool is for questions with suggested answers only, cannot switch mode anymore.
- `attempt_completion` is not available for `ask` mode. For simplicity of convos.
- `new_task` is not available for `code` mode. Same simplicity reasons.
- experimental suport for `developer` role messages for OpenAI Compatible provider. env_det sections sent there if setting is active.
- env_det section is removed from old messages as stale data, and kept only in the recent user message (with tool results or user-typed text). In theory, should save some tokens but we'll see.
