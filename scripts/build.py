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

MARK = '''<svg viewBox="0 0 24 44" aria-hidden="true"><path d="M12.00,4.00 C12.78,4.00 13.58,4.05 14.33,4.15 C15.08,4.26 15.83,4.41 16.50,4.61 C17.17,4.82 17.81,5.07 18.36,5.37 C18.91,5.67 19.41,6.02 19.79,6.41 C20.18,6.80 20.49,7.24 20.69,7.72 C20.89,8.20 21.00,8.72 21.00,9.27 C21.00,9.83 20.89,10.42 20.69,11.04 C20.49,11.66 20.18,12.32 19.79,13.00 C19.41,13.68 18.91,14.39 18.36,15.11 C17.81,15.84 17.17,16.58 16.50,17.34 C15.83,18.10 15.08,18.87 14.33,19.65 C13.58,20.43 12.78,21.22 12.00,22.00 C11.22,22.78 10.42,23.57 9.67,24.35 C8.92,25.13 8.17,25.90 7.50,26.66 C6.83,27.42 6.19,28.16 5.64,28.89 C5.09,29.61 4.59,30.32 4.21,31.00 C3.82,31.68 3.51,32.34 3.31,32.96 C3.11,33.58 3.00,34.17 3.00,34.73 C3.00,35.28 3.11,35.80 3.31,36.28 C3.51,36.76 3.82,37.20 4.21,37.59 C4.59,37.98 5.09,38.33 5.64,38.63 C6.19,38.93 6.83,39.18 7.50,39.39 C8.17,39.59 8.92,39.74 9.67,39.85 C10.42,39.95 11.22,40.00 12.00,40.00 C12.78,40.00 13.58,39.95 14.33,39.85 C15.08,39.74 15.83,39.59 16.50,39.39 C17.17,39.18 17.81,38.93 18.36,38.63 C18.91,38.33 19.41,37.98 19.79,37.59 C20.18,37.20 20.49,36.76 20.69,36.28 C20.89,35.80 21.00,35.28 21.00,34.73 C21.00,34.17 20.89,33.58 20.69,32.96 C20.49,32.34 20.18,31.68 19.79,31.00 C19.41,30.32 18.91,29.61 18.36,28.89 C17.81,28.16 17.17,27.42 16.50,26.66 C15.83,25.90 15.08,25.13 14.33,24.35 C13.58,23.57 12.78,22.78 12.00,22.00 C11.22,21.22 10.42,20.43 9.67,19.65 C8.92,18.87 8.17,18.10 7.50,17.34 C6.83,16.58 6.19,15.84 5.64,15.11 C5.09,14.39 4.59,13.68 4.21,13.00 C3.82,12.32 3.51,11.66 3.31,11.04 C3.11,10.42 3.00,9.83 3.00,9.27 C3.00,8.72 3.11,8.20 3.31,7.72 C3.51,7.24 3.82,6.80 4.21,6.41 C4.59,6.02 5.09,5.67 5.64,5.37 C6.19,5.07 6.83,4.82 7.50,4.61 C8.17,4.41 8.92,4.26 9.67,4.15 C10.42,4.05 11.22,4.00 12.00,4.00 Z" fill="currentColor"/></svg>'''
THEME_INIT_JS = '''try{var t=localStorage.getItem('tyb-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}'''
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
<html lang="en"><head><meta charset="utf-8"/><script>{THEME_INIT_JS}</script><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="description" content="The Yellow Bottle — a white and black editorial design preview. All article content is illustrative."/><title>The Yellow Bottle — Black &amp; White / Preview</title>{FONT_HEAD}<style>{read('theme.css')}</style></head>
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
<head><meta charset='UTF-8'/><script type='text/javascript'>//<![CDATA[
{THEME_INIT_JS}
//]]></script><meta content='width=device-width, initial-scale=1' name='viewport'/><title><data:view.title.escaped/></title><b:include data='blog' name='all-head-content'/>{FONT_HEAD}
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
