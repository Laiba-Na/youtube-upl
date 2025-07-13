'use client';

import { useState } from 'react';

export default function SocialAssistant() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('all');
  const [result, setResult] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult({});
    
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platform })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Parse the structured response
        const parsedResult = parseAIResponse(data.result);
        setResult(parsedResult);
      } else {
        setError(data.error || 'Request failed');
        if (data.details) {
          console.error('API Error Details:', data.details);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse the AI response into sections
  const parseAIResponse = (response: string) => {
    const sections: { [key: string]: string } = {};
    const sectionHeaders = [
      'Trending Hashtags',
      'Related Hashtags',
      'Post Ideas',
      'Pro Tip'
    ];
    
    let currentSection = '';
    
    response.split('\n').forEach(line => {
      // Check if line is a section header
      const headerMatch = line.match(/\[(.*?)\]/);
      if (headerMatch) {
        const header = headerMatch[1];
        if (sectionHeaders.includes(header)) {
          currentSection = header;
          sections[currentSection] = '';
        }
      } 
      // Add content to current section
      else if (currentSection && line.trim()) {
        sections[currentSection] += line + '\n';
      }
    });
    
    return sections;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">
            Topic/Keyword:
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter post topic or keyword"
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 font-medium">
            Platform:
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full p-3 border rounded-md"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="tumblr">Tumblr</option>
            <option value="pinterest">Pinterest</option>
            <option value="twitter">Twitter</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition ${
            loading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Generating...' : 'Get Social Media Ideas'}
        </button>
      </form>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
          <p className="mt-2 text-sm">
            Check the browser console for more details
          </p>
        </div>
      )}
      
      {Object.keys(result).length > 0 && (
        <div className="mt-8 space-y-6">
          {Object.entries(result).map(([section, content]) => (
            <div key={section} className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-lg font-semibold mb-2">{section}:</h3>
              <div className="whitespace-pre-line">{content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}