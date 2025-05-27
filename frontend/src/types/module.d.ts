declare module 'react-plotly.js' {
  import React from 'react';
  import PlotlyType from 'plotly.js';
  
  interface PlotParams {
    data: Array<Partial<PlotlyType.PlotData>>;
    layout?: Partial<PlotlyType.Layout>;
    frames?: Array<Partial<PlotlyType.Frame>>;
    config?: Partial<PlotlyType.Config>;
    style?: React.CSSProperties;
    useResizeHandler?: boolean;
    [key: string]: any;
  }
  
  class Plot extends React.Component<PlotParams> {}
  
  export default Plot;
}

declare module 'umap-js' {
  export default class UMAP {
    constructor(config?: {
      nComponents?: number;
      nNeighbors?: number;
      minDist?: number;
      spread?: number;
      [key: string]: any;
    });
    
    fit(data: number[][]): number[][];
  }
}

declare module 'tsne-js' {
  export default class TSNE {
    constructor(config?: {
      dim?: number;
      perplexity?: number;
      earlyExaggeration?: number;
      learningRate?: number;
      nIter?: number;
      metric?: string;
    });
    
    init(data: number[][]): void;
    run(): void;
    getOutput(): number[][];
  }
} 