import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getPost, getAllSlugs, ALL_POSTS } from '@/lib/blog';
import type { Section, FAQ } from '@/lib/blog/types';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `https://instagramfollowerstracker.com/blog/${slug}`;
  return {
    title: `${post.title} | Instagram Followers Tracker`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function renderSection(section: Section, idx: number) {
  switch (section.type) {
    case 'p':
      return (
        <p key={idx} className="text-slate-700 leading-relaxed font-medium">
          {section.text}
        </p>
      );
    case 'h2':
      return (
        <h2 key={idx} className="text-xl font-black text-slate-950 pt-4">
          {section.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={idx} className="text-base font-black text-slate-800 pt-2">
          {section.text}
        </h3>
      );
    case 'ul':
      return (
        <ul key={idx} className="space-y-1.5 pl-4">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-slate-700 font-medium leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={idx} className="space-y-1.5 pl-4">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-700 font-medium leading-relaxed">
              <span className="shrink-0 font-black text-cyan-600">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'tip':
      return (
        <div key={idx} className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3">
          <p className="text-sm font-bold text-cyan-800">
            <span className="mr-1">💡</span>
            {section.text}
          </p>
        </div>
      );
    case 'warning':
      return (
        <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">
            <span className="mr-1">⚠️</span>
            {section.text}
          </p>
        </div>
      );
    case 'table':
      return (
        <div key={idx} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyan-950/10">
                {section.headers.map((h, i) => (
                  <th key={i} className="py-2 pr-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2.5 pr-4 font-medium text-slate-700 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'cta':
      return (
        <div key={idx} className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 text-center">
          <p className="text-sm font-black text-slate-950">
            Track any Instagram account for free — no login required
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Daily snapshots, growth charts, and authenticity scores
          </p>
          <Link
            href="/signup"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-950 px-5 py-2 text-sm font-black text-white hover:bg-cyan-800 transition-colors"
          >
            Start Tracking Free →
          </Link>
        </div>
      );
    default:
      return null;
  }
}

function FAQSection({ faqs, postTitle }: { faqs: FAQ[]; postTitle: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="mt-10 rounded-xl border border-cyan-950/10 bg-white p-6 shadow-sm">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-lg font-black text-slate-950">
        Frequently Asked Questions
      </h2>
      <div className="mt-4 space-y-5 divide-y divide-slate-100">
        {faqs.map((faq, i) => (
          <div key={i} className={i === 0 ? '' : 'pt-5'}>
            <h3 className="text-sm font-black text-slate-900">{faq.question}</h3>
            <p className="mt-1.5 text-sm font-medium text-slate-600 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const related = ALL_POSTS.filter((p) => p.slug !== currentSlug).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.15em] text-slate-400">
        Related Articles
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border border-cyan-950/10 bg-white p-4 hover:border-cyan-500/30 transition-colors"
          >
            <p className="text-sm font-black text-slate-900 group-hover:text-cyan-700 transition-colors leading-snug">
              {post.title}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500 line-clamp-2">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'InstagramFollowersTracker.com',
      url: 'https://instagramfollowerstracker.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'InstagramFollowersTracker.com',
      url: 'https://instagramfollowerstracker.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://instagramfollowerstracker.com/blog/${slug}`,
    },
  };

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-sky-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400">
          <Link href="/" className="hover:text-cyan-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-cyan-700 transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-slate-600">{post.category}</span>
        </nav>

        {/* Article header */}
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-700">
              {post.category}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {post.readingTime} min read
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 leading-tight sm:text-4xl">
            {post.h1}
          </h1>
          <p className="mt-3 text-base font-medium text-slate-500 leading-relaxed">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-400">
            <time dateTime={post.publishedAt}>
              Published{' '}
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            {post.updatedAt !== post.publishedAt && (
              <>
                <span>·</span>
                <time dateTime={post.updatedAt}>
                  Updated{' '}
                  {new Date(post.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </>
            )}
          </div>
        </header>

        {/* Article content */}
        <article className="rounded-xl border border-cyan-950/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5">
            {post.sections.map((section, idx) => renderSection(section, idx))}
          </div>
        </article>

        {/* FAQ */}
        <FAQSection faqs={post.faqs} postTitle={post.title} />

        {/* Related posts */}
        <RelatedPosts currentSlug={slug} />

        {/* Bottom CTA */}
        <div className="mt-10 rounded-xl border border-cyan-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Ready to Start Tracking Instagram Followers?
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Free forever for one account. No Instagram login. No credit card.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-950 px-6 py-2.5 text-sm font-black text-white hover:bg-cyan-800 transition-colors"
          >
            Start Tracking Free →
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
