"use client";
import { useState, useEffect, useRef } from 'react';
import { visualizeEmbeddings } from '@/utils/api';
// import { useTheme } from '@/context/ThemeContext'; // REMOVED
import dynamic from 'next/dynamic';
// import LoadingSpinner from './LoadingSpinner'; // REMOVED - Using inline SVG for button, Plotly has its own

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Trash2, Play } from 'lucide-react'; // Icons

// Import UMAP dynamically
const UMAP = dynamic(() => import('umap-js').then(mod => mod.default), { ssr: false });

// Dynamic import for Plotly to prevent SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-neutral-800 rounded-md">
      <svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  ),
});

const EmbeddingVisualizer = () => {
  // const { theme } = useTheme(); // REMOVED
  // const isDark = theme === 'dark'; // REMOVED
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Will be used with useToast
  const [plotData, setPlotData] = useState<any | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const { toast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if(error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      })
      setError(null); // Clear error after toasting
    }
  }, [error, toast]);
  
  const handleClear = () => {
    setText('');
    setFile(null);
    setPlotData(null);
    // setError(null); // Already handled by useEffect
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({ title: "Cleared", description: "Input and visualization cleared." });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== 'text/plain') {
      setError('Only text (.txt) files are supported. Please select a different file.');
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear invalid file
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      toast({ title: "File Loaded", description: `${selectedFile.name} content loaded into text area.` });
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again or check the file.');
    };
    reader.readAsText(selectedFile);
  };
  
  const processEmbeddings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter some text or upload a .txt file to visualize.');
      return;
    }
    
    setIsLoading(true);
    // setError(null); // Handled by useEffect
    setPlotData(null); // Clear previous plot while loading new one
    
    try {
      const data = await visualizeEmbeddings(text);
      const embeddings = data.embeddings.map(item => item.vector);
      const words = data.embeddings.map(item => item.word);
      
      if (embeddings.length === 0 || embeddings.length < 3) { // UMAP needs at least 3 samples usually, more for n_neighbors
        setError('Not enough valid word embeddings to visualize. Try more diverse text.');
        setIsLoading(false);
        return;
      }
      
      try {
        const umap = new UMAP({
          nComponents: 3,
          nNeighbors: Math.min(15, embeddings.length - 1 > 0 ? embeddings.length -1 : 1), // Ensure n_neighbors is at least 1 and less than sample size
          minDist: 0.1,
          spread: 1.0,
        });
        
        const embedding3D = umap.fit(embeddings);
        
        setPlotData({
          x: embedding3D.map(point => point[0]),
          y: embedding3D.map(point => point[1]),
          z: embedding3D.map(point => point[2]),
          mode: 'markers+text',
          type: 'scatter3d',
          text: words,
          textposition: 'top center',
          marker: { size: 5, color: '#38bdf8', opacity: 0.8 }, // sky-400
          hoverinfo: 'text',
          hovertext: words,
        });
      } catch (dimError) {
        console.error('Error in dimensionality reduction:', dimError);
        const fallbackX = embeddings.map(vec => vec[0]);
        const fallbackY = embeddings.map(vec => vec[1]);
        const fallbackZ = embeddings.map(vec => vec[2] !== undefined ? vec[2] : 0); // Ensure Z has a value
        
        setPlotData({
          x: fallbackX, y: fallbackY, z: fallbackZ,
          mode: 'markers+text', type: 'scatter3d', text: words, textposition: 'top center',
          marker: { size: 5, color: '#f43f5e', opacity: 0.8 }, // rose-500 for fallback
          hoverinfo: 'text', hovertext: words.map(w => `${w} (fallback)`),
        });
        setError('Dimensionality reduction failed. Displaying fallback 3D projection.');
      }
      setProcessingTime(data.processing_time);
    } catch (apiError) {
      console.error('Error processing embeddings:', apiError);
      setError(apiError instanceof Error ? apiError.message : 'Failed to process embeddings. Check API connection.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Plotly layout configuration for dark theme
  const plotLayout = {
    autosize: true,
    margin: { l: 0, r: 0, b: 0, t: 0, pad: 4 },
    scene: {
      xaxis: { 
        title: 'X', 
        color: '#9ca3af', // gray-400
        gridcolor: '#374151', // gray-700
        zerolinecolor: '#4b5563' // gray-600
      },
      yaxis: { 
        title: 'Y', 
        color: '#9ca3af', 
        gridcolor: '#374151',
        zerolinecolor: '#4b5563'
      },
      zaxis: { 
        title: 'Z', 
        color: '#9ca3af', 
        gridcolor: '#374151',
        zerolinecolor: '#4b5563'
      }
    },
    paper_bgcolor: 'rgba(0,0,0,0)', // Transparent paper
    plot_bgcolor: 'rgba(0,0,0,0)', // Transparent plot area
    font: { color: '#e5e7eb' } // gray-200 for general font
  };

  return (
    // Removed theme-specific classes, relies on global dark theme from parent page & layout
    // The parent page now wraps this in a Card-like structure with bg-neutral-900
    <div> 
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-neutral-100">
          Word Embedding Visualizer
        </h2>
      </div>
      
      <p className="text-sm text-neutral-400 mb-6">
        Enter text or upload a .txt file to visualize word embeddings in 3D space using UMAP and Plotly.
      </p>
      
      <form onSubmit={processEmbeddings} className="space-y-6">
        <div>
          <Textarea
            className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500 focus:border-sky-500 min-h-[120px]"
            rows={5}
            placeholder="Paste your text here or it will be populated by the .txt file content..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Upload a .txt file:
            </label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              disabled={isLoading}
              className="w-full bg-neutral-800 border-neutral-700 text-neutral-300 file:text-neutral-300 file:bg-neutral-700 file:hover:bg-neutral-600 file:border-neutral-600 file:mr-3 file:py-2 file:px-3"
            />
          </div>
          <div className="flex space-x-3 pt-3 md:pt-0 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
              className="border-neutral-700 hover:bg-neutral-800 hover:text-sky-400 w-full md:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="bg-sky-600 hover:bg-sky-500 text-white w-full md:w-auto"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Visualize
            </Button>
          </div>
        </div>
       
        {/* Error messages are now handled by toasts */}

        {processingTime && plotData && (
          <p className="text-xs text-neutral-500 text-center mt-2">
            Visualization processed in {processingTime.toFixed(2)}s.
          </p>
        )}
      </form>

      {isLoading && !plotData && (
         <div className="mt-8 w-full h-[400px] flex items-center justify-center bg-neutral-800/50 rounded-md">
            <svg className="animate-spin h-10 w-10 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-neutral-400">Generating visualization...</p>
        </div>
      )}

      {plotData && !isLoading && (
        <div className="mt-8 h-[500px] md:h-[600px] bg-neutral-900 p-1 rounded-lg border border-neutral-800 shadow-xl">
          <Plot
            data={[plotData]}
            layout={plotLayout}
            useResizeHandler={true}
            className="w-full h-full"
            config={{ responsive: true, displaylogo: false }}
          />
        </div>
      )}
    </div>
  );
};

export default EmbeddingVisualizer; 