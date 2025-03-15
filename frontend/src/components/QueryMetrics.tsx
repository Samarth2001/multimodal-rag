"use client";

interface MetricsProps {
  latency?: number;
  tokensUsed?: number;
  similarityScore?: number;
  showMetrics?: boolean;
}

export default function QueryMetrics({ 
  latency = 120, 
  tokensUsed = 512,
  similarityScore = 0.87,
  showMetrics = true
}: MetricsProps) {
  if (!showMetrics) return null;
  
  return (
    <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
        <svg className="w-4 h-4 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Query Metrics
      </h3>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-800 p-2 rounded border border-gray-700">
          <div className="text-gray-400">Latency</div>
          <div className="font-mono text-emerald-400">{latency} ms</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded border border-gray-700">
          <div className="text-gray-400">Tokens</div>
          <div className="font-mono text-emerald-400">{tokensUsed}</div>
        </div>
        
        <div className="bg-gray-800 p-2 rounded border border-gray-700">
          <div className="text-gray-400">Similarity</div>
          <div className="font-mono text-emerald-400">{similarityScore.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}