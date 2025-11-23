import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface BlogPageProps {
  onNavigate: (view: View) => void;
}

const blogPosts = [
  {
    title: 'The Future of AI Monetization is Ephemeral',
    excerpt: 'Explore why non-disruptive, context-aware advertising is the only sustainable path forward for generative AI tools.',
    imageUrl: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?q=80&w=800',
    date: 'July 15, 2025',
    author: 'Alex Johnson',
  },
  {
    title: 'Introducing Semantic Targeting: Beyond the Keyword',
    excerpt: 'Our new semantic matching engine understands user intent, not just words. Learn how it creates better results for advertisers and a better experience for users.',
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800',
    date: 'June 28, 2025',
    author: 'Maria Garcia',
  },
  {
    title: 'Case Study: How AI-Chat.io Cut Compute Costs by 70%',
    excerpt: 'See the real-world impact of SubClick with our first major publisher partner, AI-Chat.io.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800',
    date: 'June 12, 2025',
    author: 'Samira Khan',
  },
];

const BlogPage: React.FC<BlogPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      onNavigate={onNavigate}
      title={<>SubClick <span className="font-serif italic">Blog</span></>}
      subtitle="Insights, announcements, and stories from the forefront of AI monetization."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {blogPosts.map((post) => (
          <div key={post.title} className="group">
            <div className="overflow-hidden rounded-lg mb-4">
              <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <p className="text-sm text-gray-500">{post.date} &bull; {post.author}</p>
            <h3 className="text-xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
            <p className="mt-2 text-gray-600">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default BlogPage;