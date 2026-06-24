# Basic Python AI Agent

Quick scaffold to send prompts to an AI API using an API key from environment variables.

Usage

- Set environment variables (example in `.env.example`).
- Dry run (no network):

```bash
python ai_agent/agent.py --prompt "Hello world" --dry-run
```

- Generic provider (POST JSON {"prompt":...} to `API_URL`):

```bash
export API_KEY=your_key
export API_URL=https://api.yourprovider/v1/generate
python ai_agent/agent.py --prompt "Hello"
```

- OpenAI provider (requires `openai` package):

```bash
export API_KEY=sk-...
export PROVIDER=openai
python ai_agent/agent.py --prompt "Hello"
```

Security

- Keep `API_KEY` out of source control; use environment variables or a secrets manager.
