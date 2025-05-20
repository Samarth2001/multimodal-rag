"use client";
import { useState } from 'react';
import EmbeddingVisualizer from '@/components/EmbeddingVisualizer';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

export default function EmbeddingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-200">
      <header className="bg-neutral-950 border-b border-neutral-800 py-3 sticky top-0 z-30">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Embedding <span className="text-sky-400">Visualizer</span>
          </h1>
          <Button variant="ghost" asChild className="text-neutral-400 hover:text-sky-400 hover:bg-neutral-800">
            <a href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </a>
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="my-6 max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-md p-6">
          <EmbeddingVisualizer />
        </div>
      </main>
    </div>
  );
} 