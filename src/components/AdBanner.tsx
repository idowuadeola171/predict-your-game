import React, { useState, useEffect } from 'react';
import { Advertisement, AdPlacement } from '../types/index.ts';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/ads?placement=${placement}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ads && data.ads.length > 0) {
            setAd(data.ads[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching ad banner:', err);
      }
    };
    fetchAd();
  }, [placement]);

  if (!ad) return null;

  const handleClick = () => {
    fetch(`/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
  };

  return (
    <div className={`w-full p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
          Sponsored
        </span>
        <span className="font-semibold text-slate-200">{ad.title}</span>
      </div>
      <a
        href={ad.linkUrl}
        onClick={handleClick}
        className="px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap"
      >
        <span>Explore Resource</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
