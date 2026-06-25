import os
import argparse
import json


class AIAgent:
    def __init__(self, api_key=None, api_url=None, provider=None, model=None, dry_run=False):
        self.api_key = api_key or os.getenv('API_KEY')
        self.api_url = api_url or os.getenv('API_URL')
        self.provider = (provider or os.getenv('PROVIDER') or 'local').lower()
        self.model = model or os.getenv('MODEL')
        self.dry_run = dry_run

    def _local_response(self, prompt):
        prompt_text = prompt.strip()
        if not prompt_text:
            return {'response': 'Please provide a prompt so I can respond.'}

        text = prompt_text.lower()
        if any(greeting in text for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return {'response': 'Hello! I am a local AI agent running without an API key.'}
        if 'weather' in text:
            return {
                'response': 'I cannot access live weather, but I can still chat and answer simple questions.'
            }
        if 'name' in text:
            return {'response': 'I am a local AI agent created to respond without external APIs.'}
        if 'joke' in text:
            return {'response': 'Why did the developer go broke? Because he used up all his cache.'}
        if any(bye in text for bye in ['bye', 'goodbye', 'see you']):
            return {'response': 'Goodbye! I am here whenever you want to chat again.'}

        return {
            'response': (
                f'I received your prompt: "{prompt_text}". '
                'I am a simple local agent that can answer basic questions without needing an API key.'
            )
        }

    def send_prompt(self, prompt, **kwargs):
        if self.provider == 'local':
            return self._local_response(prompt)

        if not self.api_key and not self.dry_run:
            raise RuntimeError('API key is required for remote providers (set API_KEY environment variable)')

        if self.dry_run:
            print('DRY RUN: would send to', self.provider)
            print('API URL:', self.api_url)
            print('Payload:', json.dumps({'prompt': prompt, 'model': self.model}, indent=2))
            return {'dry_run': True, 'prompt': prompt}

        if self.provider == 'openai':
            try:
                import openai
            except Exception as e:
                raise RuntimeError('openai package required for provider=openai') from e
            openai.api_key = self.api_key
            payload = kwargs.get('payload') or {
                'model': self.model or 'gpt-4o-mini',
                'messages': [{'role': 'user', 'content': prompt}],
            }
            resp = openai.ChatCompletion.create(**payload)
            return resp

        # Generic HTTP POST
        if not self.api_url:
            raise RuntimeError('API URL is required for generic provider (set API_URL)')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
        }
        payload = {'prompt': prompt}
        if self.model:
            payload['model'] = self.model
        payload.update(kwargs.get('extra', {}))

        try:
            import requests
        except Exception as e:
            raise RuntimeError('requests package required for generic provider') from e

        r = requests.post(self.api_url, headers=headers, json=payload, timeout=15)
        r.raise_for_status()
        try:
            return r.json()
        except ValueError:
            return {'text': r.text}


def main():
    p = argparse.ArgumentParser(description='Basic AI agent client')
    p.add_argument('--prompt', '-p', help='Prompt to send', required=True)
    p.add_argument('--provider', help='Provider (local, openai, generic)', default='local')
    p.add_argument('--api-url', help='API URL for generic provider')
    p.add_argument('--model', help='Model name')
    p.add_argument('--dry-run', action='store_true', help='Show payload without sending')
    args = p.parse_args()

    agent = AIAgent(
        api_key=None,
        api_url=args.api_url,
        provider=args.provider,
        model=args.model,
        dry_run=args.dry_run,
    )

    resp = agent.send_prompt(args.prompt)
    print('\nResponse:')
    try:
        print(json.dumps(resp, indent=2, ensure_ascii=False))
    except Exception:
        print(resp)


if __name__ == '__main__':
    main()
