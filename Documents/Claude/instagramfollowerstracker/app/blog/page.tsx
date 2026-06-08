import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ALL_POSTS } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Instagram Follower Tracker Blog - Growth Tips, Unfollow Guides & Analytics',
  description:
    'Expert guides on Instagram follower tracking, unfollow detection, competitor analysis, engagement rate, fake follower detection, influencer vetting, and organic growth strategies — all free.',
  alternates: {
    canonical: 'https://instagramfollowerstracker.com/blog',
  },
  openGraph: {
    title: 'Instagram Follower Tracker Blog - Growth Tips, Unfollow Guides & Analytics',
    description:
      'Expert guides on Instagram follower tracking, unfollow detection, competitor analysis, engagement rate, fake follower detection, and organic growth strategies.',
    url: 'https://instagramfollowerstracker.com/blog',
    type: 'website',
  },
};

const CATEGORY_ORDER = ['Guides', 'How-To', 'Reviews', 'Strategies'];

function groupByCategory(posts: typeof ALL_POSTS) {
  const map = new Map<string, typeof ALL_POSTS>();
  for (const cat of CATEGORY_ORDER) {
    map.set(cat, []);
  }
  for (const post of posts) {
    const list = map.get(post.category) ?? [];
    list.push(post);
    map.set(post.category, list);
  }
  return map;
}

export default function BlogPage() {
  const byCategory = groupByCategory(ALL_POSTS);

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
            Resource Library
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">
            Instagram Follower Tracker Blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-slate-500">
            Expert guides on Instagram follower tracking, unfollow detection,
            competitor analysis, fake follower checking, influencer vetting,
            engagement rate, and organic growth strategies — all free.
          </p>
        </div>

        {/* Posts by category */}
        {CATEGORY_ORDER.map((category) => {
          const posts = byCategory.get(category) ?? [];
          if (posts.length === 0) return null;
          return (
            <section key={category} className="mb-12">
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-xl border border-cyan-950/10 bg-white p-5 shadow-sm transition-all hover:border-cyan-500/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span>{post.readingTime} min read</span>
                      <span>·</span>
                      <time dateTime={post.updatedAt}>
                        {new Date(post.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    <h3 className="mt-2 text-base font-black text-slate-950 group-hover:text-cyan-700 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm font-medium text-slate-500 leading-relaxed">
                      {post.description}
                    </p>
                    <span className="mt-3 text-xs font-bold text-cyan-600 group-hover:underline">
                      Read article →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Start Tracking Public Instagram Accounts
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Daily public follower snapshots, growth charts, and authenticity
            scores. No Instagram login required.
          </p>
          <Link
            href="/auth/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-950 px-6 py-2.5 text-sm font-black text-white hover:bg-cyan-800 transition-colors"
          >
            Start Tracking Free
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
