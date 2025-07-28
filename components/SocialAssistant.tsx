'use client';

import { useState } from 'react';
import { useDarkMode } from '@/app/DarkModeContext'; // Import dark mode context

export default function SocialAssistant() {
  const { darkMode } = useDarkMode(); // Use dark mode context
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
        body: JSON.stringify({ prompt, platform }),
        credentials: 'include', // Include credentials for authenticated requests
      });

      const data = await res.json();

      if (res.ok) {
        const parsedResult = parseAIResponse(data.result);
        setResult(parsedResult);
      } else {
        setError(data.error || 'Failed to generate social media ideas');
        if (data.details) {
          console.error('API Error Details:', data.details);
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (response: string) => {
    const sections: { [key: string]: string } = {};
    const sectionHeaders = [
      'Trending Hashtags',
      'Related Hashtags',
      'Post Ideas',
      'Pro Tip',
    ];

    let currentSection = '';

    response.split('\n').forEach((line) => {
      const headerMatch = line.match(/\[(.*?)\]/);
      if (headerMatch) {
        const header = headerMatch[1];
        if (sectionHeaders.includes(header)) {
          currentSection = header;
          sections[currentSection] = '';
        }
      } else if (currentSection && line.trim()) {
        sections[currentSection] += line + '\n';
      }
    });

    return sections;
  };

  return (
    <div
      className={`max-w-2xl mx-auto p-6 rounded-lg shadow-md ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-textBlack'
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className={`block mb-2 font-medium ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}
          >
            Topic/Keyword:
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter post topic or keyword"
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-textBlack'
            }`}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label
            className={`block mb-2 font-medium ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}
          >
            Platform:
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={`w-full p-3 border rounded-md ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-textBlack'
            }`}
            aria-label="Select social media platform"
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
          className={`w-full py-3 px-4 rounded-md font-medium transition ${
            darkMode
              ? 'bg-primaryPurple hover:bg-highlightBlue text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          aria-label="Generate social media ideas"
        >
          {loading ? 'Generating...' : 'Get Social Media Ideas'}
        </button>
      </form>

      {error && (
        <div
          className={`mt-6 p-4 rounded-md ${
            darkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-700'
          }`}
        >
          <strong>Error:</strong> {error}
          <p className="mt-2 text-sm">
            Check the browser console for more details
          </p>
        </div>
      )}

      {Object.keys(result).length > 0 && (
        <div className="mt-8 space-y-6">
          {Object.entries(result).map(([section, content]) => (
            <div
              key={section}
              className={`p-4 rounded-md ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-textBlack'
                }`}
              >
                {section}:
              </h3>
              <div className="whitespace-pre-line">{content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}