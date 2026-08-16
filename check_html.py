from html.parser import HTMLParser
from pathlib import Path

text = Path('portfolio.html').read_text(encoding='utf-8')

class TagChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        self.void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

    def handle_starttag(self, tag, attrs):
        if tag not in self.void:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append(f'Extra closing tag </{tag}> at {self.getpos()}')
            return
        last, pos = self.stack.pop()
        if last != tag:
            self.errors.append(f'Tag mismatch: expected </{last}> but got </{tag}> at {self.getpos()}')

    def close(self):
        super().close()
        for tag, pos in self.stack:
            self.errors.append(f'Missing closing tag for <{tag}> opened at {pos}')

checker = TagChecker()
checker.feed(text)
checker.close()
for error in checker.errors:
    print(error)
print('Total errors:', len(checker.errors))
