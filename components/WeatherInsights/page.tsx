'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WeatherData } from '@/app/types/weather';

interface WeatherInsightsProps {
  weatherData: WeatherData;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildWeatherContext(d: WeatherData): string {
  const c = d.current;
  const today = d.forecast[0];
  const tonight = d.nightForecast[0];
  const lines = [
    `Location: ${d.location}`,
    `Current: ${c.temperature}°F, ${c.shortForecast}`,
    c.feelsLike != null ? `Feels like: ${c.feelsLike}°F` : null,
    c.humidity   != null ? `Humidity: ${c.humidity}%` : null,
    `Wind: ${c.windSpeed} ${c.windDirection}`,
    today   ? `Today's high: ${today.temperature}°F — ${today.shortForecast}` : null,
    tonight ? `Tonight: ${tonight.temperature}°F — ${tonight.shortForecast}` : null,
    '',
    '3-day outlook:',
    ...d.forecast.slice(0, 3).map((p, i) =>
      `  ${i === 0 ? 'Today' : p.name}: ${p.temperature}°F, ${p.shortForecast}`
    ),
  ];
  return lines.filter(l => l !== null).join('\n');
}

export default function WeatherInsights({ weatherData }: WeatherInsightsProps) {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming]     = useState(false);
  const [input, setInput]                = useState('');
  const [error, setError]                = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const initialKey = useRef<string>('');

  const streamQuery = useCallback(async (newMessages: Message[], context: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setStreamingText('');
    setError(null);

    try {
      const res = await fetch('/api/weather-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, weatherContext: context }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg || 'Failed to get AI response');
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamingText(full);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }]);
      setStreamingText('');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('Connection lost. Is Ollama running?');
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // Auto-generate initial insights whenever the location changes
  useEffect(() => {
    const key = weatherData.location;
    if (key === initialKey.current) return;
    initialKey.current = key;

    const context = buildWeatherContext(weatherData);
    const city = weatherData.location;
    const initial: Message = {
      role: 'user',
      content: `Give me a 24-hour weather outlook for ${city} and health and wellbeing recommendations based on these conditions.`,
    };
    setMessages([initial]);
    streamQuery([initial], context);
  }, [weatherData, streamQuery]);

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    streamQuery(next, buildWeatherContext(weatherData));
  };

  return (
    <div className="bg-white/20 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="text-xl font-semibold text-white">AI Weather Insights</h3>
          <p className="text-blue-200 text-xs">Powered by Ollama · local &amp; private</p>
        </div>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-2 text-blue-200 text-sm">
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
            Thinking…
          </div>
        )}
      </div>

      {/* Message list */}
      <div className="px-6 py-4 space-y-4 max-h-[480px] overflow-y-auto">
        {messages.map((msg, i) => {
          // Hide the initial auto-generated user prompt — show it as a subtle label instead
          if (i === 0 && msg.role === 'user') return null;
          return (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span className="text-lg flex-shrink-0 mt-0.5">
                {msg.role === 'user' ? '👤' : '🤖'}
              </span>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-blue-50'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Streaming bubble */}
        {isStreaming && (
          <div className="flex gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">🤖</span>
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-sm text-blue-50 leading-relaxed max-w-[85%] whitespace-pre-wrap">
              {streamingText || (
                <span className="flex gap-1 items-center text-blue-300">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 text-sm text-red-200">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-white/10 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a follow-up — umbrella? good day to run? what to eat?"
          disabled={isStreaming}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-blue-300/70 border border-white/10 focus:outline-none focus:border-white/30 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2.5 bg-white/20 hover:bg-white/30 disabled:opacity-40 rounded-xl text-white font-medium text-sm transition-colors"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
