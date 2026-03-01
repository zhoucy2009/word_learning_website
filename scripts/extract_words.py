#!/usr/bin/env python3
"""
Extract words from ECDICT CSV and generate seed.js data for the word learning app.

Courses mapping:
  - igcse: academic words, BNC 2000-12000, oxford or collins 2+
  - ib:    cet4/cet6 academic level, BNC 3000-15000
  - ielts: tag=ielts
  - toefl: tag=toefl
  - gre:   tag=gre
"""

import csv
import json
import sys
import os
import re

WORDS_PER_COURSE = 200
PRO_EXTRA = 40
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'ecdict.csv')

POS_FROM_TRANSLATION = {
    'n.': 'noun', 'v.': 'verb', 'vt.': 'verb', 'vi.': 'verb',
    'adj.': 'adj', 'a.': 'adj', 'adv.': 'adv', 'ad.': 'adv',
    'prep.': 'prep', 'conj.': 'conj', 'pron.': 'pron', 'num.': 'num',
}


def clean_translation(raw):
    """Extract short Chinese definition (max 3 meanings)."""
    if not raw:
        return None
    lines = raw.replace('\\n', '\n').split('\n')
    meanings = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('[') and ']' in line:
            continue
        cleaned = re.sub(r'^[a-z]+\.\s*', '', line)
        if not cleaned:
            continue
        parts = [p.strip() for p in cleaned.split('；')]
        for p in parts:
            sub = [s.strip() for s in p.split('，') if s.strip()]
            meanings.extend(sub[:2])
        if len(meanings) >= 3:
            break
    if not meanings:
        return None
    return '，'.join(meanings[:3])


def clean_definition(raw):
    """Extract first meaningful English definition."""
    if not raw:
        return None
    lines = raw.replace('\\n', '\n').split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        cleaned = re.sub(r'^[a-z]+\.\s*', '', line)
        if cleaned and 5 <= len(cleaned) <= 80:
            return cleaned
    return None


def clean_phonetic(raw):
    if not raw or raw.strip() == '':
        return None
    p = raw.strip()
    if not p.startswith('/'):
        p = '/' + p
    if not p.endswith('/'):
        p = p + '/'
    return p


def extract_pos(pos_field, translation):
    """Extract POS from ECDICT pos field or translation prefix."""
    if pos_field:
        parts = pos_field.strip().split('/')
        best_pos = None
        best_pct = 0
        pos_map = {
            'n': 'noun', 'v': 'verb', 'j': 'adj', 'r': 'adv',
            'a': 'adj', 'd': 'adv', 'u': 'noun', 'e': 'verb',
            'i': 'prep', 'c': 'conj', 'm': 'noun'
        }
        for part in parts:
            if ':' in part:
                code, pct = part.split(':', 1)
                try:
                    pct_val = float(pct)
                except ValueError:
                    continue
                if pct_val > best_pct:
                    best_pct = pct_val
                    best_pos = code.strip()
        if best_pos and best_pos in pos_map:
            return pos_map[best_pos]

    if translation:
        for prefix, pos in POS_FROM_TRANSLATION.items():
            if translation.strip().startswith(prefix):
                return pos
    return None


def is_valid_word(word_str):
    if not word_str:
        return False
    if len(word_str) < 3 or len(word_str) > 18:
        return False
    if ' ' in word_str or '-' in word_str:
        return False
    if not word_str.isalpha():
        return False
    if not word_str.islower():
        return False
    return True


def get_freq(row):
    """Get best frequency estimate."""
    try:
        bnc = int(row.get('bnc', 0) or 0)
        frq = int(row.get('frq', 0) or 0)
    except ValueError:
        return 0
    if bnc > 0 and frq > 0:
        return min(bnc, frq)
    return max(bnc, frq)


def extract_words():
    words = []
    seen = set()

    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = row.get('word', '').strip()
            if not is_valid_word(word):
                continue
            if word in seen:
                continue

            raw_translation = row.get('translation', '')
            translation = clean_translation(raw_translation)
            definition = clean_definition(row.get('definition', ''))
            phonetic = clean_phonetic(row.get('phonetic', ''))
            pos = extract_pos(row.get('pos', ''), raw_translation)

            if not translation:
                continue

            tag = row.get('tag', '').strip()
            tags = set(tag.split()) if tag else set()

            try:
                oxford_val = int(row.get('oxford', 0) or 0)
                collins_val = int(row.get('collins', 0) or 0)
            except ValueError:
                oxford_val, collins_val = 0, 0

            freq = get_freq(row)

            entry = {
                'word': word,
                'phonetic': phonetic,
                'definition': definition,
                'translation': translation,
                'pos': pos,
                'freq': freq,
                'tags': tags,
                'oxford': oxford_val,
                'collins': collins_val,
            }

            seen.add(word)
            words.append(entry)

    print(f"Total valid words loaded: {len(words)}")
    return words


def assign_difficulty_spread(words_list, low=150, high=850):
    """Assign difficulty values spread evenly across the range based on frequency rank."""
    sorted_words = sorted(words_list, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)
    n = len(sorted_words)
    for i, w in enumerate(sorted_words):
        if n <= 1:
            w['difficulty'] = (low + high) // 2
        else:
            w['difficulty'] = int(round(low + (high - low) * i / (n - 1)))
    return sorted_words


def select_for_course(all_words, course_id, count):
    """Select words for a given course."""

    too_basic = set()
    for w in all_words:
        if w['freq'] > 0 and w['freq'] < 800:
            too_basic.add(w['word'])

    if course_id == 'igcse':
        pool = [w for w in all_words
                if (w['oxford'] == 1 or w['collins'] >= 2)
                and w['word'] not in too_basic
                and w.get('definition')]
        pool = sorted(pool, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)
        pool = pool[:count * 2]

    elif course_id == 'ib':
        pool = [w for w in all_words
                if ('cet4' in w['tags'] or 'cet6' in w['tags'] or w['oxford'] == 1)
                and w['word'] not in too_basic
                and w.get('definition')]
        pool = sorted(pool, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)
        pool = pool[:count * 2]

    elif course_id == 'ielts':
        pool = [w for w in all_words if 'ielts' in w['tags'] and w.get('definition')]
        pool = sorted(pool, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)

    elif course_id == 'toefl':
        pool = [w for w in all_words if 'toefl' in w['tags'] and w.get('definition')]
        pool = sorted(pool, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)

    elif course_id == 'gre':
        pool = [w for w in all_words if 'gre' in w['tags'] and w.get('definition')]
        pool = sorted(pool, key=lambda w: w['freq'] if w['freq'] > 0 else 999999)
    else:
        pool = []

    # Take evenly spaced samples for variety of difficulty
    if len(pool) > count:
        step = len(pool) / count
        selected = [pool[int(i * step)] for i in range(count)]
    else:
        selected = pool[:count]

    return selected


def select_pro_words(all_words, course_id, base_words, count):
    """Select harder pro-mode words not in base set."""
    base_set = {w['word'] for w in base_words}

    if course_id == 'gre':
        pool = [w for w in all_words
                if 'gre' in w['tags'] and w['word'] not in base_set and w.get('definition')]
    elif course_id in ('ielts', 'toefl'):
        pool = [w for w in all_words
                if course_id in w['tags'] and w['word'] not in base_set and w.get('definition')]
    else:
        pool = [w for w in all_words
                if (w['collins'] >= 1 or 'cet6' in w['tags'] or 'ky' in w['tags'])
                and w['word'] not in base_set
                and w.get('definition')]

    # Sort by frequency descending (rarer = harder)
    pool = sorted(pool, key=lambda w: -(w['freq'] if w['freq'] > 0 else 999999))
    return pool[:count]


def generate_output(course_data):
    """Generate JS word entries and maps."""
    word_id_counter = [0]
    all_js_words = []
    word_to_id = {}
    course_word_map = {}
    pro_course_word_map = {}

    for course_id, (base_words, pro_words) in course_data.items():
        base_ids = []
        for w in base_words:
            if w['word'] not in word_to_id:
                word_id_counter[0] += 1
                wid = f"w{word_id_counter[0]}"
                word_to_id[w['word']] = wid
                js_word = {
                    'id': wid,
                    'lemma': w['word'],
                    'pos': w['pos'],
                    'phonetics': w['phonetic'],
                    'difficulty': w['difficulty'],
                    'senses': {
                        'en': w['definition'] or 'Definition not available.',
                        'zh': w['translation']
                    },
                }
                all_js_words.append(js_word)
            base_ids.append(word_to_id[w['word']])
        course_word_map[course_id] = base_ids

        pro_ids = []
        for w in pro_words:
            if w['word'] not in word_to_id:
                word_id_counter[0] += 1
                wid = f"w{word_id_counter[0]}"
                word_to_id[w['word']] = wid
                js_word = {
                    'id': wid,
                    'lemma': w['word'],
                    'pos': w['pos'],
                    'phonetics': w['phonetic'],
                    'difficulty': w['difficulty'],
                    'senses': {
                        'en': w['definition'] or 'Definition not available.',
                        'zh': w['translation']
                    },
                    'pro': {
                        'en': w['definition'] or 'Advanced definition.',
                        'zh': w['translation']
                    }
                }
                all_js_words.append(js_word)
            pro_ids.append(word_to_id[w['word']])
        pro_course_word_map[course_id] = pro_ids

    return all_js_words, course_word_map, pro_course_word_map


def escape_js(s):
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')


def format_js_word(w):
    lines = []
    lines.append('  {')
    lines.append(f'    id: "{w["id"]}",')
    lines.append(f'    lemma: "{w["lemma"]}",')
    lines.append(f'    pos: {json.dumps(w["pos"])},')
    ph = escape_js(w['phonetics']) if w.get('phonetics') else None
    lines.append(f'    phonetics: {json.dumps(ph)},')
    lines.append(f'    difficulty: {w["difficulty"]},')
    en_def = escape_js(w['senses']['en'])
    zh_def = escape_js(w['senses']['zh'])
    lines.append(f'    senses: {{ en: "{en_def}", zh: "{zh_def}" }}')
    if 'pro' in w:
        pro_en = escape_js(w['pro']['en'])
        pro_zh = escape_js(w['pro']['zh'])
        lines[-1] += ','
        lines.append(f'    pro: {{ en: "{pro_en}", zh: "{pro_zh}" }}')
    lines.append('  }')
    return '\n'.join(lines)


def main():
    print("Loading ECDICT data...")
    all_words = extract_words()

    courses = ['igcse', 'ib', 'ielts', 'toefl', 'gre']
    course_data = {}

    for course_id in courses:
        print(f"\nSelecting words for {course_id.upper()}...")
        base = select_for_course(all_words, course_id, WORDS_PER_COURSE)
        base = assign_difficulty_spread(base, low=150, high=750)
        pro = select_pro_words(all_words, course_id, base, PRO_EXTRA)
        pro = assign_difficulty_spread(pro, low=650, high=900)
        course_data[course_id] = (base, pro)
        print(f"  Base: {len(base)} words, Pro extra: {len(pro)} words")
        if base:
            diffs = [w['difficulty'] for w in base]
            print(f"  Difficulty range: {min(diffs)}-{max(diffs)}")
        if base:
            samples = [base[0]['word'], base[len(base)//4]['word'],
                       base[len(base)//2]['word'], base[3*len(base)//4]['word'],
                       base[-1]['word']]
            print(f"  Sample words: {', '.join(samples)}")

    print("\nGenerating seed_generated.js...")
    js_words, cwm, pcwm = generate_output(course_data)
    print(f"Total unique words: {len(js_words)}")

    output_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'seed_generated.js')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('export const courses = [\n')
        f.write('  { id: "igcse", name: "IGCSE" },\n')
        f.write('  { id: "ib", name: "IB" },\n')
        f.write('  { id: "ielts", name: "IELTS" },\n')
        f.write('  { id: "toefl", name: "TOEFL" },\n')
        f.write('  { id: "gre", name: "GRE" }\n')
        f.write('];\n\n')

        f.write('export const words = [\n')
        for i, w in enumerate(js_words):
            f.write(format_js_word(w))
            if i < len(js_words) - 1:
                f.write(',')
            f.write('\n')
        f.write('];\n\n')

        f.write('export const passages = [\n')
        f.write('  {\n    id: "p1", courseId: "igcse", title: "A Forest Classroom",\n')
        f.write('    sourceLabel: "Open sample passage (IGCSE-style)", licenseLabel: "CC0", difficulty: 320,\n')
        f.write('    text: "Students met in a forest clearing to study ecology. The guide explained how shade helps sustain cool temperatures and how insects migrate across adjacent habitats. The group recorded precise notes and evaluated the evidence together."\n  },\n')
        f.write('  {\n    id: "p2", courseId: "ielts", title: "City Air and Trees",\n')
        f.write('    sourceLabel: "Open sample passage (IELTS-style)", licenseLabel: "CC0", difficulty: 520,\n')
        f.write('    text: "Urban planners allocate space for trees to mitigate heat. The transition to greener streets depends on persistent care, but abundant shade often improves comfort for residents."\n  },\n')
        f.write('  {\n    id: "p3", courseId: "gre", title: "Data and Decisions",\n')
        f.write('    sourceLabel: "Open sample passage (GRE-style)", licenseLabel: "CC0", difficulty: 640,\n')
        f.write('    text: "Researchers derive coherent explanations from complex data. Their meticulous approach reduces constraint-related errors and strengthens inference about long-term change."\n  },\n')
        f.write('  {\n    id: "p4", courseId: "ib", title: "Systems and Choices",\n')
        f.write('    sourceLabel: "Open sample passage (IB-style)", licenseLabel: "CC0", difficulty: 460,\n')
        f.write('    text: "Students evaluate how communities allocate resources. They derive clarity from coherent arguments and make inferences about long-term transition planning."\n  },\n')
        f.write('  {\n    id: "p5", courseId: "toefl", title: "Habitats and Climate",\n')
        f.write('    sourceLabel: "Open sample passage (TOEFL-style)", licenseLabel: "CC0", difficulty: 440,\n')
        f.write('    text: "Animals in adjacent habitats adjust to climate constraints. Scientists evaluate changes and record precise observations to support coherent reports."\n  }\n')
        f.write('];\n\n')

        f.write('export const courseWordMap = {\n')
        for i, (cid, ids) in enumerate(cwm.items()):
            chunk_size = 10
            id_chunks = [ids[j:j+chunk_size] for j in range(0, len(ids), chunk_size)]
            f.write(f'  {cid}: [\n')
            for ci, chunk in enumerate(id_chunks):
                ids_str = ', '.join(f'"{wid}"' for wid in chunk)
                comma = ',' if ci < len(id_chunks) - 1 else ''
                f.write(f'    {ids_str}{comma}\n')
            comma = ',' if i < len(cwm) - 1 else ''
            f.write(f'  ]{comma}\n')
        f.write('};\n\n')

        f.write('export const proCourseWordMap = {\n')
        for i, (cid, ids) in enumerate(pcwm.items()):
            ids_str = ', '.join(f'"{wid}"' for wid in ids)
            comma = ',' if i < len(pcwm) - 1 else ''
            f.write(f'  {cid}: [{ids_str}]{comma}\n')
        f.write('};\n\n')

        f.write('export const extraDefinitions = {};\n')

    print(f"\nGenerated: {output_path}")
    for cid in courses:
        base, pro = course_data[cid]
        print(f"  {cid.upper()}: {len(base)} base + {len(pro)} pro = {len(base)+len(pro)} total")


if __name__ == '__main__':
    main()
