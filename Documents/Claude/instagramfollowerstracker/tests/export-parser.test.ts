import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMultipleInstagramFiles } from '../lib/export-parser';

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
