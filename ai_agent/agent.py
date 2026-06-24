import os
import argparse
import json


class AIAgent:
    def __init__(self, api_key=None, api_url=None, provider=None, model=None, dry_run=False):
        self.api_key = api_key or os.getenv('API_KEY')
        self.api_url = api_url or os.getenv('API_URL')
        self.provider = (provider or os.getenv('PROVIDER') or 'generic').lower()
        self.model = model or os.getenv('MODEL')
        self.dry_run = dry_run

    def send_prompt(self, prompt, **kwargs):
        if not self.api_key and self.provider != 'none' and not self.dry_run:
            raise RuntimeError('API key is required (set API_KEY environment variable)')

        if self.dry_run:
            print('DRY RUN: would send to', self.provider or 'generic')
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
    p.add_argument('--provider', help='Provider (openai or generic)')
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
