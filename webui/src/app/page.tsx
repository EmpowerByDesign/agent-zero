import React from 'react';
import TopNav from '../components/TopNav';
import PreviewPane from '../components/PreviewPane';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <section className="lg:w-1/2 p-4 border-r border-gray-200 bg-white overflow-auto">
          <h2 className="text-xl font-bold mb-4">Chat Area</h2>
          <div className="bg-gray-100 p-4 rounded">Placeholder for Agent Zero chat integration</div>
        </section>
        <PreviewPane />
      </main>
    </div>
  );
}
