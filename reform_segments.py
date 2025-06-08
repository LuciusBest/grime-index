import json, sys

PUNCT_END = {'.', '!', '?'}


def split_segment(seg, max_words=9):
    words = seg['words']
    speaker = seg.get('speaker')
    new_segs = []
    buf = []
    for w in words:
        buf.append(w)
        if w['word'].strip().endswith(tuple(PUNCT_END)) or len(buf) >= max_words:
            new_segs.append(buf)
            buf = []
    if buf:
        new_segs.append(buf)
    final = []
    for chunk in new_segs:
        if final and len(chunk) <= 2 and len(final[-1]) + len(chunk) <= max_words:
            final[-1].extend(chunk)
        else:
            final.append(chunk)
    new_segs = final
    result = []
    for chunk in new_segs:
        result.append({
            'start': chunk[0]['start'],
            'end': chunk[-1]['end'],
            'text': ' '.join(w['word'] for w in chunk),
            'words': chunk,
            'speaker': speaker
        })
    return result


def merge_orphans(segments, max_words=9):
    i = 0
    while i < len(segments):
        seg = segments[i]
        if len(seg['words']) <= 2:
            merged = False
            if i > 0 and segments[i-1]['speaker'] == seg['speaker'] and len(segments[i-1]['words']) + len(seg['words']) <= max_words:
                # merge with previous
                segments[i-1]['words'].extend(seg['words'])
                segments[i-1]['end'] = seg['end']
                segments[i-1]['text'] += ' ' + seg['text']
                segments.pop(i)
                merged = True
            elif i+1 < len(segments) and segments[i+1]['speaker'] == seg['speaker'] and len(segments[i+1]['words']) + len(seg['words']) <= max_words:
                # merge with next
                segments[i+1]['words'] = seg['words'] + segments[i+1]['words']
                segments[i+1]['start'] = seg['start']
                segments[i+1]['text'] = seg['text'] + ' ' + segments[i+1]['text']
                segments.pop(i)
                merged = True
            if merged:
                continue
            # attempt to borrow from previous
            if i > 0 and segments[i-1]['speaker'] == seg['speaker'] and len(segments[i-1]['words']) > 2:
                while len(seg['words']) < 3 and len(segments[i-1]['words']) > 3:
                    moved = segments[i-1]['words'].pop()
                    seg['words'].insert(0, moved)
                    seg['start'] = moved['start']
                    seg['text'] = ' '.join(w['word'] for w in seg['words'])
                    segments[i-1]['end'] = segments[i-1]['words'][-1]['end']
                    segments[i-1]['text'] = ' '.join(w['word'] for w in segments[i-1]['words'])
        i += 1
    return segments


def process_file(path):
    data = json.load(open(path))
    new_segments = []
    for seg in data['segments']:
        if len(seg['words']) > 9:
            new_segments.extend(split_segment(seg))
        else:
            new_segments.append(seg)
    new_segments = merge_orphans(new_segments)
    data['segments'] = new_segments
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Processed {path}: segments {len(data['segments'])}")

if __name__ == '__main__':
    for file in sys.argv[1:]:
        process_file(file)
