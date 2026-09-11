#!/usr/bin/env python3
"""Offline, fail-closed OpenAlex Topics CSV -> reviewed static science snapshot.

Download the official CSV separately; this script never performs network requests.
No runtime service, credentials, dependency installation, or user state is involved.
"""
import argparse
import csv
import hashlib
import io
import json
from datetime import date
from pathlib import Path

SOURCE = 'https://docs.google.com/spreadsheets/d/1v-MAq64x4YjhO7RWcB-yrKV5D_2vOOsxl4u6GBKEXY8/export?format=csv'
EXPECTED = {'domain': 4, 'field': 26, 'subfield': 252, 'topic': 4516}


def make_snapshot(raw, checked_on):
    date.fromisoformat(checked_on)
    rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
    nodes = {}
    for row in rows:
        parent = 'science'
        for kind in EXPECTED:
            source_id = row[f'{kind}_id']
            if not source_id.isascii() or not source_id.isdecimal() or source_id.startswith('0'):
                raise ValueError(f'Invalid source {kind} ID: {source_id!r}')
            node_id = f'{kind}:{"T" if kind == "topic" else ""}{source_id}'
            label = row[f'{kind}_name']
            if not label.strip() or any(ord(c) < 32 for c in label):
                raise ValueError(f'Invalid label for {node_id}')
            node = {'id': node_id, 'sourceId': source_id, 'label': label, 'kind': kind, 'parent': parent}
            if kind == 'topic':
                if node_id in nodes:
                    raise ValueError(f'Duplicate topic: {node_id}')
                if not row['summary'].strip():
                    raise ValueError(f'Missing description: {node_id}')
                node.update(description=row['summary'], keywords=row['keywords'])
            if node_id in nodes and nodes[node_id] != node:
                raise ValueError(f'Conflicting source hierarchy: {node_id}')
            nodes[node_id] = node
            parent = node_id
    counts = {kind: sum(n['kind'] == kind for n in nodes.values()) for kind in EXPECTED}
    if counts != EXPECTED:
        raise ValueError(f'Source universe changed or is incomplete: expected {EXPECTED}, got {counts}. Review before updating expected counts.')
    return {
        'schema': 'openlab.science-tree.v1',
        'provenance': {
            'publisher': 'OpenAlex / OurResearch', 'sourceUrl': SOURCE,
            'documentationUrl': 'https://help.openalex.org/data/topics/',
            'repositoryUrl': 'https://github.com/ourresearch/openalex-topic-classification',
            'license': 'CC0', 'licenseUrl': 'https://help.openalex.org/access/get-the-data',
            'checkedOn': checked_on, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
            'classification': 'Research-literature containment. Topic names and descriptions are machine-generated from citation clusters; not an exhaustive ontology or a prerequisite map.',
        },
        'counts': counts,
        'nodes': sorted(nodes.values(), key=lambda n: (list(EXPECTED).index(n['kind']), int(n['sourceId']))),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--checked-on', required=True, help='Actual primary-source verification date, YYYY-MM-DD')
    parser.add_argument('--output', type=Path, default=Path('src/data/lab-science-tree.json'))
    args = parser.parse_args()
    snapshot = make_snapshot(args.input.read_bytes(), args.checked_on)
    text = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')) + '\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + '.tmp')
    temporary.write_text(text)
    temporary.replace(args.output)
    print(json.dumps({'output': str(args.output), 'counts': snapshot['counts'], 'sourceSha256': snapshot['provenance']['sourceSha256'], 'bytes': len(text.encode())}))


if __name__ == '__main__':
    main()
