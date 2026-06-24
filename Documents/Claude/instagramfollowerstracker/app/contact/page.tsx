import type { Metadata } from 'next';
import { ContactForm } from './ContactForm';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Contact Us | Instagram Followers Tracker',
  description: 'Get in touch with the Instagram Followers Tracker team. We reply within 24 hours.',
  alternates: { canonical: 'https://www.instagramfollowerstracker.com/contact' },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Contact Us</h1>
        <p className="mt-3 text-slate-500">
          Have a question, bug report, or feature request? We read every message and typically reply within 24 hours.
        </p>
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
