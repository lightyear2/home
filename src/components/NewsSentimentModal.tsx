import React from 'react';
import { NewsSentimentData, getSentimentBadgeProps } from '../utils/newsSentiment';
import {
  X,
  ExternalLink,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface NewsSentimentModalProps {
  data: NewsSentimentData | null;
  isLoading: boolean;
  onRefresh: (ticker: string) => void;
  onClose: () => void;
}

export const NewsSentimentModal: React.FC<NewsSentimentModalProps> = ({
  data,
  isLoading,
  onRefresh,
  onClose,
}) => {
  if (!data && !isLoading) return null;

  const badgeProps = data ? getSentimentBadgeProps(data.sentimentScore) : null;
  const scorePercent = data ? ((data.sentimentScore + 100) / 200) * 100 : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e1422] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 bg-[#121929]/90 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-bold text-white tracking-wide">
                  {data?.ticker || 'Loading...'}
                </span>
                <span className="text-xs text-slate-400">{data?.market}</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Google Search Grounded
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 mt-0.5">
                {data?.name} — Recent News & Market Sentiment
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => onRefresh(data.ticker)}
                disabled={isLoading}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Refresh Google Search grounding"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-100px)] overflow-y-auto">
          {isLoading && !data && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">
                Searching Google for recent headlines & computing sentiment...
              </p>
              <p className="text-xs text-slate-500">
                Grounded via Gemini 3.8 Flash with Google Search
              </p>
            </div>
          )}

          {data && (
            <>
              {/* Sentiment Score Gauge Card */}
              <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Calculated News Sentiment Score
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${badgeProps?.text} ${badgeProps?.bg} ${badgeProps?.border}`}
                  >
                    {data.sentimentScore >= 0 ? `+${data.sentimentScore}` : data.sentimentScore} / 100 ({data.sentimentLabel.replace('_', ' ')})
                  </span>
                </div>

                {/* Score Track Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
                      style={{ left: '50%' }}
                      title="Neutral (0)"
                    />
                    <div
                      className={`h-full transition-all duration-500 ${
                        data.sentimentScore >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                      style={{
                        width: `${Math.abs(data.sentimentScore) / 2}%`,
                        marginLeft: data.sentimentScore >= 0 ? '50%' : `${50 - Math.abs(data.sentimentScore) / 2}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>-100 Extremely Bearish</span>
                    <span>0 Neutral</span>
                    <span>+100 Extremely Bullish</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-[#0b0f17] p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                  <strong className="text-white">Synthesis: </strong>
                  {data.summary}
                </p>
              </div>

              {/* Key Sentiment Drivers */}
              {data.keyDrivers && data.keyDrivers.length > 0 && (
                <div className="bg-[#111726] p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    Key Market Drivers
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {data.keyDrivers.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grounded Headlines List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recent Grounded Headlines ({data.headlines.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Updated {new Date(data.fetchedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {data.headlines.map((headline, idx) => (
                    <a
                      key={idx}
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3.5 rounded-xl bg-[#111726] hover:bg-[#151e33] border border-slate-800 hover:border-slate-700 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                              {headline.source}
                            </span>
                            {headline.publishedTime && (
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {headline.publishedTime}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {headline.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {headline.snippet}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-1 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Google Search Queries Grounding Metadata */}
              {data.searchQueries && data.searchQueries.length > 0 && (
                <div className="bg-[#0b0f17] p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>Google Search Grounding Queries:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.searchQueries.map((q, idx) => (
                      <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
