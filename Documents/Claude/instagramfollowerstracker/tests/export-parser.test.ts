import assert from 'node:assert/strict';
import test from 'node:test';
import { deflateRawSync } from 'node:zlib';
import { parseMultipleInstagramFiles } from '../lib/export-parser';
import { buildRelationshipIntelligence } from '../lib/relationship-intelligence';

test('parses Instagram JSON followers and following files', async () => {
  const followers = new File(
    [
      JSON.stringify({
        relationships_followers: [
          {
            title: 'Riz',
            string_list_data: [
              {
                value: 'riz',
                href: 'https://www.instagram.com/riz/',
                timestamp: 1_700_000_000,
              },
            ],
          },
        ],
      }),
    ],
    'followers_1.json',
    { type: 'application/json' }
  );

  const following = new File(
    [
      JSON.stringify({
        relationships_following: [
          {
            title: 'Splitflask',
            string_list_data: [
              {
                value: 'splitflask',
                href: 'https://www.instagram.com/splitflask/',
                timestamp: 1_700_000_001,
              },
            ],
          },
        ],
      }),
    ],
    'following.json',
    { type: 'application/json' }
  );

  const parsed = await parseMultipleInstagramFiles([followers, following]);

  assert.deepEqual(parsed.data.followers.map((person) => person.handle), ['riz']);
  assert.deepEqual(parsed.data.following.map((person) => person.handle), ['splitflask']);
});

test('parses Instagram HTML followers, following, and recently unfollowed files', async () => {
  const followersHtml = new File(
    [
      [
        '<a href="https://www.instagram.com/riz">riz</a></div><div>May 16, 2026 6:17 am</div>',
        '<a href="https://www.instagram.com/splitflask">splitflask</a></div><div>May 17, 2026 7:18 pm</div>',
      ].join('\n'),
    ],
    'followers_1.html',
    { type: 'text/html' }
  );

  const followingHtml = new File(
    [
      '<a href="https://www.instagram.com/_u/notfollowingback">notfollowingback</a></div><div>May 18, 2026 8:19 pm</div>',
    ],
    'following.html',
    { type: 'text/html' }
  );

  const recentlyUnfollowedHtml = new File(
    ['<td>Username</td><td>lostfriend</td>'],
    'recently_unfollowed_profiles.html',
    { type: 'text/html' }
  );

  const parsed = await parseMultipleInstagramFiles([
    followersHtml,
    followingHtml,
    recentlyUnfollowedHtml,
  ]);

  assert.deepEqual(parsed.data.followers.map((person) => person.handle), [
    'riz',
    'splitflask',
  ]);
  assert.deepEqual(parsed.data.following.map((person) => person.handle), [
    'notfollowingback',
  ]);
  assert.deepEqual(parsed.recentlyUnfollowed.map((person) => person.handle), [
    'lostfriend',
  ]);
  assert.ok(parsed.data.followers[0]?.followedAt instanceof Date);
});

test('deduplicates handles across uploaded files', async () => {
  const file = new File(
    [
      JSON.stringify({
        relationships_followers: [
          {
            string_list_data: [
              { value: 'Riz', href: 'https://www.instagram.com/Riz/' },
            ],
          },
          {
            string_list_data: [
              { value: 'riz', href: 'https://www.instagram.com/riz/' },
            ],
          },
        ],
      }),
    ],
    'followers_1.json',
    { type: 'application/json' }
  );

  const parsed = await parseMultipleInstagramFiles([file]);

  assert.deepEqual(parsed.data.followers.map((person) => person.handle), ['riz']);
});

test('extracts recently unfollowed profiles from ZIP uploads', async () => {
  const zip = createZip([
    {
      name: 'connections/followers_and_following/followers_1.html',
      content: '<a href="https://www.instagram.com/riz">riz</a></div><div>May 16, 2026 6:17 am</div>',
    },
    {
      name: 'connections/followers_and_following/following.html',
      content: '<a href="https://www.instagram.com/_u/splitflask">splitflask</a></div><div>May 18, 2026 8:19 pm</div>',
    },
    {
      name: 'connections/followers_and_following/recently_unfollowed_profiles.html',
      content: '<td>Username</td><td>lostfriend</td>',
    },
  ]);

  const parsed = await parseMultipleInstagramFiles([
    new File([new Uint8Array(zip)], 'instagram-riz-2026-06-07-test.zip', {
      type: 'application/zip',
    }),
  ]);

  assert.deepEqual(parsed.data.followers.map((person) => person.handle), ['riz']);
  assert.deepEqual(parsed.data.following.map((person) => person.handle), ['splitflask']);
  assert.deepEqual(parsed.recentlyUnfollowed.map((person) => person.handle), [
    'lostfriend',
  ]);
});

test('builds relationship intelligence from one export', () => {
  const report = buildRelationshipIntelligence({
    followers: [{ handle: 'mutual' }, { handle: 'fan' }],
    following: [{ handle: 'mutual' }, { handle: 'ghost' }],
  });

  assert.equal(report.mutualCount, 1);
  assert.equal(report.notFollowingBackCount, 1);
  assert.equal(report.fansNotFollowedCount, 1);
  assert.deepEqual(report.notFollowingBack.map((person) => person.handle), ['ghost']);
  assert.deepEqual(report.fansNotFollowed.map((person) => person.handle), ['fan']);
  assert.equal(report.followRatio, 1);
  assert.ok(report.healthScore > 0);
});

function createZip(entries: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const raw = Buffer.from(entry.content);
    const compressed = deflateRawSync(raw);
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
