from bs4 import BeautifulSoup
from pathlib import Path
html = Path('portfolio.html').read_text(encoding='utf-8')
soup = BeautifulSoup(html, 'html.parser')
for section_id in ['hero','about','contact']:
    sec = soup.find(id=section_id)
    print('SECTION', section_id)
    if sec:
        print(sec.prettify()[:1800])
    else:
        print('missing')
    print('---')
