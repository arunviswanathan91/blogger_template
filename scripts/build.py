#!/usr/bin/env python3
"""Build a self-contained HTML preview and Blogger-compatible XML from shared sources."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'

def read(name):
    return (SRC / name).read_text(encoding='utf-8')

def fill(source, mapping):
    for name, value in mapping.items():
        source = source.replace('__' + name + '__', value)
    return source

MARK = '''<svg viewBox="0 0 24 44" aria-hidden="true"><path d="M8 2h8v11c0 5 7 7 7 14v14H1V27c0-7 7-9 7-14V2Z" fill="currentColor"/><circle cx="12" cy="29" r="5" fill="#fff"/></svg>'''
TYPE_CONTROLS = '''<div class="type-controls"><span class="micro muted">Reading size</span><button data-size="down" aria-label="Decrease text size">A−</button><button data-size="up" aria-label="Increase text size">A+</button></div>'''
FONTS = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;family=EB+Garamond:ital,wght@0,400;0,500;1,400&amp;family=Noto+Sans+Malayalam:wght@400;500&amp;family=Noto+Serif+Malayalam:wght@400&amp;display=swap'
FONT_HEAD = f'''<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
<link rel="stylesheet" href="{FONTS}"/>'''
CATEGORIES = [('poetry','കവിതകൾ','ente%20kavithakal'),('stories','കഥകൾ','ente%20kathakal'),('essays','ലേഖനങ്ങൾ','Article'),('selected','തിരഞ്ഞെടുത്ത','My%20picks'),('video','വീഡിയോസ്','Video')]

def links(preview):
    mapping = {'MARK':MARK, 'SCULPTURE':read('sculpture.svg'), 'STUDY':read('study.svg'), 'TYPE_CONTROLS':TYPE_CONTROLS}
    mapping['HOME_ATTR'] = 'href="#home"' if preview else "expr:href='data:blog.homepageUrl'"
    mapping['JOURNAL_ATTR'] = 'href="#home"' if preview else "expr:href='data:blog.homepageUrl + \"#writing\"'"
    mapping['ARCHIVE_ATTR'] = 'href="#archive"'
    mapping['SEARCH_ATTR'] = 'action="#home"' if preview else "expr:action='data:blog.homepageUrl + \"search\"'"
    mapping['SEARCH_NOTE'] = 'Search the sample titles and writing in this design preview.' if preview else 'Search the journal in English or Malayalam.'
    mapping['PREVIEW_NOTE'] = '<p class="preview-note">Design preview. All five entries are illustrative sample writing, not posts fetched from the live blog.</p>' if preview else ''
    for key, label, path in CATEGORIES:
        mapping[key.upper() + '_ATTR'] = f'href="#category/{key}"' if preview else f"expr:href='data:blog.homepageUrl + \"search/label/{path}\"'"
    filters = f'<nav class="filters" aria-label="Writing categories"><a class="filter" data-filter="all" {mapping["JOURNAL_ATTR"]}>All writing</a>'
    for key, label, path in CATEGORIES:
        filters += f'<a class="filter" data-filter="{key}" lang="ml" {mapping[key.upper()+"_ATTR"]}>{label}</a>'
    mapping['FILTERS'] = filters + '</nav>'
    mapping['HERO'] = fill(read('hero.html'), mapping)
    return mapping

def preview():
    values = links(True)
    values['ARCHIVE'] = ''
    values['MAIN'] = fill('''
<section id="home-view"><div id="opening">__HERO__</div>
<article class="lead" id="featured"><a class="lead-art" href="#read/hand" aria-label="Read The shape of a hand">__STUDY__</a><div class="lead-copy"><div class="lead-meta micro"><span>01 / The opening page</span><span class="muted">Poetry &amp; prose / Sample</span></div><h2 class="lead-title"><a href="#read/hand">The shape<br/>of a hand.</a></h2><p>Some things are remembered without thinking. A voice. A warmth. The outline of someone who is no longer in the room.</p><a class="text-link" href="#read/hand">Read the story <span class="arrow" aria-hidden="true">↗</span></a></div></article>
<section class="writing" id="writing" aria-labelledby="writing-heading"><div class="section-heading"><h2 id="writing-heading">Collected <em>writing.</em></h2><span class="micro muted" id="result-count" aria-live="polite">Sample writing / 02–05</span></div>__FILTERS__<div id="post-list"></div><nav class="pagination" aria-label="More writing"><span class="micro muted">There is more between the lines.</span><a class="text-link" href="#archive">Explore the index <span class="arrow" aria-hidden="true">↗</span></a></nav></section></section>
<section id="reader-view" hidden="hidden"><div class="reader-toolbar"><a href="#home">← All writing</a>__TYPE_CONTROLS__</div><article class="reading-page"><div class="micro muted" id="reader-category"></div><h1 class="article-title" id="reader-title"></h1><p class="article-deck" id="reader-deck"></p><div class="article-byline"><span>Arun Viswanathan / Sample writing</span><span id="reader-date"></span></div><div class="article-body" id="reader-body"></div><div class="article-end"><a href="#home">← All writing</a><button type="button" data-copy="true" aria-live="polite">Copy preview link ↗</button></div><div class="comments"><h3>A note in the margin.</h3><p>This is a reading specimen. The installed theme uses your blog’s native comment system.</p></div></article></section>
<section id="index-view" hidden="hidden"><div class="archive-heading"><span class="micro">02 / The index — sample entries</span><h1>Every page,<br/><em>a place.</em></h1></div><div id="index-list"></div><nav class="pagination" aria-label="Return"><a class="text-link" href="#home">← Return to the journal</a></nav></section>
<noscript><p class="empty">This interactive preview requires JavaScript. The Blogger theme renders real posts and navigation without it.</p></noscript>
''', values)
    body = fill(read('frame.html'), values)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="description" content="The Yellow Bottle — a white and black editorial design preview. All article content is illustrative."/><title>The Yellow Bottle — Black &amp; White / Preview</title>{FONT_HEAD}<style>{read('theme.css')}</style></head>
<body data-preview="true" class="is-index">{body}<script>{read('sample-posts.js')}</script><script>{read('theme.js')}</script><script>{read('preview.js')}</script></body></html>'''

def blogger():
    values = links(False)
    values['COMMENTS'] = read('blogger-comments.xml')
    values['MAIN'] = fill(read('blogger-main.xml'), values)
    values['ARCHIVE'] = '''<details class='archive-details' id='archive'><summary>02 / The index — browse by month</summary><b:section id='archivefooter' maxwidgets='1' showaddelement='false'><b:widget id='BlogArchive1' locked='true' title='The index' type='BlogArchive' version='2' visible='true'><b:widget-settings><b:widget-setting name='showStyle'>FLAT</b:widget-setting><b:widget-setting name='frequency'>MONTHLY</b:widget-setting><b:widget-setting name='chronological'>false</b:widget-setting><b:widget-setting name='showPosts'>false</b:widget-setting></b:widget-settings><b:includable id='main' var='this'><ul class='archive-items'><b:loop values='data:this.data' var='interval'><li><a expr:href='data:interval.url'><data:interval.name/> <span class='muted'>(<data:interval.post-count/>)</span></a></li></b:loop></ul></b:includable></b:widget></b:section></details>'''
    body = fill(read('frame.html'), values)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsVersion='3' b:responsive='true' expr:dir='data:blog.languageDirection' expr:lang='data:blog.locale' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head><meta charset='UTF-8'/><meta content='width=device-width, initial-scale=1' name='viewport'/><title><data:view.title.escaped/></title><b:include data='blog' name='all-head-content'/>{FONT_HEAD}
<b:skin version='1.0.0'><![CDATA[{read('theme.css')}]]></b:skin>
<b:template-skin><![CDATA[body#layout .overlay,body#layout .hero,body#layout .about,body#layout .footer-type{{display:none}}body#layout .wrap{{margin:0}}body#layout #archive{{display:block}}]]></b:template-skin>
</head><body expr:class='data:view.isSingleItem ? "is-reader" : "is-index"'>{body}<script type='text/javascript'>//<![CDATA[
{read('theme.js')}
//]]></script></body></html>'''

if __name__ == '__main__':
    for filename, output in [('index.html', preview()), ('the-yellow-bottle.xml', blogger())]:
        missing = re.findall(r'__[A-Z_]+__', output)
        if missing:
            raise ValueError(f'Unresolved placeholders in {filename}: {missing}')
        (ROOT / filename).write_text(output + '\n', encoding='utf-8')
        print(f'Built {filename} ({len(output.encode()):,} bytes)')
