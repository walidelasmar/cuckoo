'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOOGLE_API_KEY = 'AIzaSyDI_ezgJjM_RtC0Kj1zB8IlopDw49Cezs8';
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  countryCode,
  placeholder = 'Start typing an address...',
  id,
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        input,
        languageCode: 'en',
      };
      if (countryCode) {
        body.includedRegionCodes = [countryCode.toLowerCase()];
      }
      const res = await fetch(AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
        },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      const results: Suggestion[] = (data.suggestions || []).map((s: any) => {
        const pred = s.placePrediction;
        return {
          placeId: pred.placeId,
          mainText: pred.structuredFormat?.mainText?.text || pred.text?.text || '',
          secondaryText: pred.structuredFormat?.secondaryText?.text || '',
          fullText: pred.text?.text || '',
        };
      });
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSuggestions([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [countryCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.fullText);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
          {suggestions.map((s, index) => (
            <li
              key={s.placeId}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className={cn(
                'flex items-start gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground',
                index === activeIndex && 'bg-accent text-accent-foreground'
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">{s.mainText}</span>
                {s.secondaryText && <span className="text-muted-foreground ml-1">{s.secondaryText}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
