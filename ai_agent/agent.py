import os
import argparse
import json
import re
from html.parser import HTMLParser


class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_stack = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside'):
            self.skip_stack += 1
        if self.skip_stack == 0 and tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title', 'section'):
            self.text_parts.append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside') and self.skip_stack > 0:
            self.skip_stack -= 1
        if self.skip_stack == 0 and tag in ('p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title', 'section'):
            self.text_parts.append('\n')

    def handle_data(self, data):
        if self.skip_stack == 0:
            cleaned = data.strip()
            if cleaned:
                self.text_parts.append(cleaned + ' ')

    def get_text(self):
        return ' '.join(' '.join(self.text_parts).split())


class WebsiteKnowledge:
    def __init__(self, site_dir=None):
        root = os.path.dirname(os.path.abspath(__file__))
        self.site_dir = site_dir or os.path.normpath(os.path.join(root, '..', 'Aviator Guide'))
        self.pages = []
        self._load_site_pages()

    def _extract_title(self, html):
        match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else None

    def _extract_text(self, path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                html = f.read()
        except FileNotFoundError:
            return ''

        main_match = re.search(r'<main.*?>(.*?)</main>', html, flags=re.IGNORECASE | re.DOTALL)
        html = main_match.group(1) if main_match else html
        html = re.sub(r'<nav.*?</nav>', '', html, flags=re.IGNORECASE | re.DOTALL)
        html = re.sub(r'<footer.*?</footer>', '', html, flags=re.IGNORECASE | re.DOTALL)

        extractor = HTMLTextExtractor()
        extractor.feed(html)
        text = extractor.get_text()
        text = re.sub(r'(Homepage|Subjects, Degrees and Licenses|Engineering Colleges and Pilot Training Centers|Resources and Advice|Contact Us)', '', text, flags=re.IGNORECASE)
        return re.sub(r'\s+', ' ', text).strip()

    def _extract_headings(self, html):
        headings = re.findall(r'<h[1-6].*?>(.*?)</h[1-6]>', html, flags=re.IGNORECASE | re.DOTALL)
        cleaned = [re.sub(r'<.*?>', '', h).strip() for h in headings]
        return [heading for heading in cleaned if heading]

    def _load_site_pages(self):
        if not os.path.isdir(self.site_dir):
            return

        for filename in sorted(os.listdir(self.site_dir)):
            if not filename.lower().endswith('.html'):
                continue
            path = os.path.join(self.site_dir, filename)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    html = f.read()
            except Exception:
                continue

            title = self._extract_title(html) or filename
            text = self._extract_text(path)
            headings = self._extract_headings(html)
            if text:
                self.pages.append({'file': filename, 'title': title, 'text': text, 'headings': headings})

    def _page_boost(self, prompt, page):
        prompt_lower = prompt.lower()
        title = page['title'].lower()
        headings = ' '.join(page.get('headings', [])).lower()
        boost = 0
        if any(key in prompt_lower for key in ['training center', 'training centers', 'pilot training', 'pilot centers']):
            if 'training centers' in title or 'pilot training centers' in headings or 'pilot training centers' in title:
                boost += 20
        if any(key in prompt_lower for key in ['subject', 'degree', 'license', 'medical requirement']):
            if 'subjects' in title or 'degrees' in title or 'licenses' in title or 'pilot licenses' in headings:
                boost += 20
        if any(key in prompt_lower for key in ['resource', 'advice', 'salary', 'mental preparation', 'lifestyle']):
            if 'resources' in title or 'advice' in title or 'resources' in headings or 'advice' in headings:
                boost += 20
        if any(key in prompt_lower for key in ['contact', 'reach out', 'get in touch']):
            if 'contact' in title or 'contact' in headings:
                boost += 20
        return boost

    def _score_page(self, prompt, page):
        prompt_words = set(re.findall(r"\w+", prompt.lower()))
        text = page['text'].lower()
        title = page['title'].lower()
        headings = ' '.join(page.get('headings', [])).lower()
        score = sum(1 for word in prompt_words if word in text or word in title or word in headings)
        score += self._page_boost(prompt, page)
        return score

    def find_relevant_pages(self, prompt, limit=2):
        scored = []
        for page in self.pages:
            score = self._score_page(prompt, page)
            if score > 0:
                scored.append((score, page))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [item[1] for item in scored[:limit]]

    def get_snippet(self, prompt, page, snippet_length=250):
        prompt_words = set(re.findall(r"\w+", prompt.lower()))
        lower_text = page['text'].lower()
        best_idx = None
        for word in prompt_words:
            if len(word) < 4:
                continue
            idx = lower_text.find(word)
            if idx >= 0:
                best_idx = idx
                break

        if best_idx is None:
            return page['text'][:snippet_length].strip()

        start = max(0, best_idx - 80)
        end = min(len(page['text']), best_idx + snippet_length)
        snippet = page['text'][start:end].strip()
        return snippet.replace('\n', ' ').strip()

    def get_overview(self):
        summary = []
        for page in self.pages:
            summary.append(f"{page['title']}: {page['text'][:150].strip()}...")
        return '\n'.join(summary)


class AIAgent:
    def __init__(self, api_key=None, api_url=None, provider=None, model=None, dry_run=False, site_dir=None):
        self.api_key = api_key or os.getenv('API_KEY')
        self.api_url = api_url or os.getenv('API_URL')
        self.provider = (provider or os.getenv('PROVIDER') or 'local').lower()
        self.model = model or os.getenv('MODEL')
        self.dry_run = dry_run
        self.site_knowledge = WebsiteKnowledge(site_dir=site_dir)

    def _local_response(self, prompt):
        prompt_text = prompt.strip()
        if not prompt_text:
            return {'response': 'Please provide a prompt so I can respond.'}

        pages = self.site_knowledge.find_relevant_pages(prompt_text)
        if pages:
            page = pages[0]
            page_lower = page['title'].lower() + ' ' + ' '.join(page.get('headings', [])).lower()
            if any(keyword in prompt_text.lower() for keyword in ['training center', 'training centers', 'pilot training']):
                if 'pilot training centers' in page_lower or 'pilot training center' in page_lower or 'training centers in uae' in page_lower:
                    centers = [heading for heading in page.get('headings', []) if any(k in heading.lower() for k in ['academy', 'university', 'institute', 'academy', 'polytechnic'])]
                    if centers:
                        return {'response': f"The website lists these UAE training centers: {', '.join(centers)}. For details on their programs and locations, see the Engineering Colleges and Pilot Training Centers page."}

            if any(keyword in prompt_text.lower() for keyword in ['subject', 'degree', 'license', 'medical requirement']):
                return {
                    'response': (
                        f"The site’s Subjects, Degrees and Licenses page explains the academic subjects and pilot licenses. "
                        f"{self.site_knowledge.get_snippet(prompt_text, page)}"
                    )
                }

            snippet = self.site_knowledge.get_snippet(prompt_text, page)
            clean_snippet = re.sub(r'\s+', ' ', snippet).strip()
            response_lines = [f"Based on '{page['title']}': {clean_snippet}"]
            if len(pages) > 1:
                response_lines.append(f"Also check '{pages[1]['title']}' for more related details.")
            return {'response': ' '.join(response_lines)}

        generic = self._general_local_answer(prompt_text)
        return generic

    def _general_local_answer(self, prompt):
        text = prompt.lower()
        if any(greeting in text for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return {'response': 'Hello! Ask me about this Aviator Guide website and its career guidance content.'}
        if 'what is this website about' in text or 'what can i learn' in text:
            return {
                'response': (
                    'This website is the Aviator Guide for becoming a pilot in the UAE. '
                    'It covers pilot training pathways, licenses, engineering colleges, flight schools, resources, and career advice.'
                )
            }
        if 'contact' in text or 'contact us' in text:
            return {
                'response': (
                    'The Contact page invites aspiring pilots to reach out for guidance on training programs, career advice, and next steps.'
                )
            }
        return {
            'response': (
                'I am a local Aviator Guide assistant. I can answer questions about the UAE pilot training website, its pages, and the information it contains. '
                'Try asking about pilot licenses, training centers, or resources.'
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
