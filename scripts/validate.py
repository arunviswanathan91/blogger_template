#!/usr/bin/env python3
"""Check generated Blogger structure, shared outputs, and publication-critical invariants."""
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build import ROOT, preview, blogger

B = 'http://www.google.com/2005/gml/b'
X = 'http://www.w3.org/1999/xhtml'
NS = {'b': B, 'h': X}

class PreviewParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.hashes = []
    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if 'id' in attr:
            self.ids.append(attr['id'])
        if tag == 'a' and attr.get('href', '').startswith('#'):
            self.hashes.append(attr['href'])

for filename, build in [('index.html', preview), ('the-yellow-bottle.xml', blogger)]:
    actual = (ROOT / filename).read_text()
    assert actual == build() + '\n', f'{filename} is stale. Run scripts/build.py.'
    assert not re.search(r'__[A-Z_]+__', actual), f'{filename}: unresolved tokens'
    assert '© 2009–2026 Arun Viswanathan | TheYellow Bottle. All rights reserved.' in actual
    assert 'href="https://arunviswanathan91.blogspot.com/p/copy-right-statement.html"' in actual

tree = ET.fromstring((ROOT / 'the-yellow-bottle.xml').read_text())
assert len(tree.findall('h:head/b:skin', NS)) == 1
sections = tree.findall('.//b:section', NS)
for section in sections:
    assert all(child.tag == f'{{{B}}}widget' for child in section), f'Non-widget child in {section.attrib["id"]}'
widgets = tree.findall('.//b:widget', NS)
assert {widget.attrib['type'] for widget in widgets} == {'Blog', 'BlogArchive'}
for widget in widgets:
    names = [part.attrib['id'] for part in widget.findall('b:includable', NS)]
    assert names.count('main') == 1
    assert len(names) == len(set(names)), f'Duplicate include in {widget.attrib["id"]}'
    # These are native v2 Blogger includes, supplied by the platform.
    native = {'postMetadataJSON', 'manageComments'}
    for include in widget.findall('.//b:include', NS):
        assert include.attrib['name'] in set(names) | native, f'Unresolved include: {include.attrib["name"]}'
xml = (ROOT / 'the-yellow-bottle.xml').read_text()
for required in ['<data:post.body/>','data:olderPageUrl','data:newerPageUrl','data:view.isSingleItem','data:post.allowComments','name="q"']:
    assert required in xml, f'Missing production behavior: {required}'
for sample in ['SAMPLE_POSTS','#read/hand','Illustrative /','sample-posts.js']:
    assert sample not in xml, f'Preview content leaked into XML: {sample}'

page = PreviewParser()
page.feed((ROOT / 'index.html').read_text())
assert len(page.ids) == len(set(page.ids)), 'Duplicate preview element IDs'
for fragment in page.hashes:
    assert fragment in ['#home','#archive'] or fragment.startswith(('#read/', '#category/')) or fragment[1:] in page.ids, f'Unresolved fragment: {fragment}'
for script in ['theme.js','figures.js','preview.js','sample-posts.js']:
    subprocess.run(['node','--check',str(ROOT/'src'/script)], check=True)
print('PASS: reproducible builds, XML parse, Blogger sections/includes, native data, copyright, preview isolation, anchors, JavaScript syntax.')
