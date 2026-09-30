import React, { useState, useEffect } from 'react';
import { SportsArticle, SportType } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';
import { Newspaper, Search, ChevronRight, X, Clock, User, Share2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext.tsx';

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<SportsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<SportType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<SportsArticle | null>(null);
  const { toast } = useNotification();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Error fetching sports news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const filtered = articles.filter((a) => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${a.title} ${a.summary} ${a.author}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const featured = articles.find((a) => a.featured) || articles[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-24">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Quantitative Sports News
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tactical analysis, xG modeling studies, and spatial telemetry breakdowns from professional sports research.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news & analysis..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category Pills/Buttons (functional interactive controls) */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-xs">
        {(['All', 'Football', 'Basketball', 'Tennis', 'Other'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedCategory === cat ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Lead Story */}
      {featured && selectedCategory === 'All' && !searchQuery && (
        <div
          onClick={() => setSelectedArticle(featured)}
          className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-[#0F172A] hover:border-slate-700 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-blue-400 font-semibold">{featured.category}</span>
              <span>·</span>
              <span>Featured Intelligence</span>
              <span>·</span>
              <span>{new Date(featured.publishedAt).toLocaleDateString()}</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
              {featured.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {featured.summary}
            </p>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {featured.author}
              </span>
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                Read Report <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 flex items-center justify-center relative">
            <img
              src={featured.imageUrl}
              alt={featured.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback styled container
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-60" />
          </div>
        </div>
      )}

      {/* Ad slot for News */}
      <AdBanner placement="NEWS" />

      {/* Articles Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading sports analysis articles...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0F172A]">
          <p className="text-sm font-semibold text-slate-300">No articles found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedArticle(item)}
              className="p-5 rounded-2xl border border-slate-800 bg-[#0F172A] hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="text-blue-400 font-semibold">{item.category}</span>
                  <span>·</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-display text-base font-bold text-white line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[170px]">{item.author}</span>
                <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                  Read <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0F172A] p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span className="text-blue-400 font-semibold">{selectedArticle.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedArticle.publishedAt).toLocaleDateString()}
                </span>
                <span>·</span>
                <span>{selectedArticle.author}</span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
                {selectedArticle.title}
              </h1>
            </div>

            {selectedArticle.imageUrl && (
              <div className="rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed italic">
              {selectedArticle.summary}
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>MatchSense AI Quantitative Sports Journalism Desk</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast('Article link copied', 'info');
                }}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
