import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HandleSearch } from '@/components/home/HandleSearch';
import type { SeoPageConfig } from '@/lib/seo-pages';
import { SEO_PAGES } from '@/lib/seo-pages';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

interface KeywordLandingPageProps {
  page: SeoPageConfig;
}

export async function KeywordLandingPage({ page }: KeywordLandingPageProps) {
  const [session, topAccounts] = await Promise.all([
    auth(),
    Promise.race([
      prisma.publicAccount
        .findMany({ orderBy: { followerCount: 'desc' }, take: 100, select: { handle: true } })
        .catch(() => [] as { handle: string }[]),
      new Promise<{ handle: string }[]>((resolve) => setTimeout(() => resolve([]), 5000)),
    ]),
  ]);

  const ctaHref = session?.user ? '/dashboard' : '/auth/signup';
  const ctaLabel = session?.user ? 'Go to Dashboard' : page.primaryCta;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://instagramfollowerstracker.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: `https://instagramfollowerstracker.com/${page.slug}`,
      },
    ],
  };

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Instagram Followers Tracker',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `https://instagramfollowerstracker.com/${page.slug}`,
    description: page.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />

      <main>
        <section className="relative overflow-hidden border-b border-cyan-950/10 bg-sky-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(rgba(8,47,73,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(8,47,73,0.08)_1px,transparent_1px)] bg-[size:42px_42px]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-20">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-cyan-950/10 bg-white px-4 py-2 text-sm font-black uppercase text-teal-800">
                {page.eyebrow}
              </p>
              <h1 className="max-w-3xl text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
                {page.h1}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                {page.intro}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {ctaLabel}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-cyan-950/10 bg-white px-6 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"
                >
                  {page.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-950/10 bg-white p-5 shadow-2xl shadow-cyan-950/10">
              <p className="mb-4 text-sm font-black text-slate-950">
                Look up an Instagram account
              </p>
              <HandleSearch />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {page.proofPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-lg border border-cyan-950/10 bg-slate-50 p-4 text-sm font-bold text-slate-700"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-black text-slate-950">
              Built for the searches that matter
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page focuses on the exact intent behind these keyword
              variants while keeping the workflow useful for real account
              tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {page.keywordCluster.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-800"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="border-y border-cyan-950/10 bg-sky-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black text-slate-950">
                What you can do with it
              </h2>
              <div className="mt-6 space-y-4">
                {page.useCases.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-cyan-950/10 bg-white p-5"
                  >
                    <h3 className="font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-950">
                How it works
              </h2>
              <ol className="mt-6 space-y-4">
                {page.workflow.map((item, index) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-3xl font-black text-slate-950">
            Questions
          </h2>
          <div className="mt-8 space-y-5">
            {page.faq.map((item) => (
              <div key={item.question} className="rounded-lg border border-cyan-950/10 p-5">
                <h3 className="font-black text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Start tracking today</h2>
              <p className="mt-1 text-sm text-slate-300">
                One account is free. Upgrade only when you need more coverage.
              </p>
            </div>
            <Link
              href={ctaHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-white"
            >
              {ctaLabel}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12">
          <p className="mb-4 text-xs font-black uppercase text-slate-400">
            More tracking pages
          </p>
          <div className="flex flex-wrap gap-3">
            {SEO_PAGES.filter((item) => item.slug !== page.slug).map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className="text-sm font-bold text-slate-600 underline-offset-4 hover:text-teal-700 hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer topAccounts={topAccounts} className="mt-0" />
    </>
  );
}
