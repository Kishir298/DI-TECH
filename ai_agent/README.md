# Basic Python AI Agent

A minimal local AI agent that can respond to prompts without an API key.

Usage

- Local mode (no API key required):

```bash
python ai_agent/agent.py --prompt "Hello world"
```

- Dry run mode (no network):

```bash
python ai_agent/agent.py --prompt "Hello world" --dry-run
```

Optional remote providers

- OpenAI provider (optional, requires `openai` package and `API_KEY`):

```bash
export API_KEY=sk-...
python ai_agent/agent.py --prompt "Hello" --provider openai
```

- Generic HTTP provider (optional, requires `requests` and `API_KEY`):

```bash
export API_KEY=your_key
python ai_agent/agent.py --prompt "Hello" --provider generic --api-url https://api.yourprovider/v1/generate
```

Local mode does not need any external service or API key.
