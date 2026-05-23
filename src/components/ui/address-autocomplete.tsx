'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDI_ezgJjM_RtC0Kj1zB8IlopDw49Cezs8';

declare global {
  interface Window {
    google: typeof google;
    __googleMapsLoaded?: boolean;
    __googleMapsCallbacks?: Array<() => void>;
  }
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.__googleMapsLoaded) { resolve(); return; }
    if (!window.__googleMapsCallbacks) window.__googleMapsCallbacks = [];
    window.__googleMapsCallbacks.push(resolve);
    if (document.getElementById('google-maps-script')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=__googleMapsReady`;
    script.async = true;
    script.defer = true;
    (window as any).__googleMapsReady = () => {
      window.__googleMapsLoaded = true;
      (window.__googleMapsCallbacks || []).forEach(cb => cb());
      window.__googleMapsCallbacks = [];
    };
    document.head.appendChild(script);
  });
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
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mapsReady, setMapsReady] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      setMapsReady(true);
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((input: string) => {
    if (!mapsReady || !autocompleteService.current || input.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    const request: google.maps.places.AutocompletionRequest = {
      input,
      types: ['address'],
      ...(countryCode ? { componentRestrictions: { country: countryCode } } : {}),
    };
    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
        setIsOpen(true);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    });
  }, [mapsReady, countryCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onChange(prediction.description);
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
          {suggestions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(prediction); }}
              className={cn(
                'flex items-start gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground',
                index === activeIndex && 'bg-accent text-accent-foreground'
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">{prediction.structured_formatting.main_text}</span>
                <span className="text-muted-foreground ml-1">{prediction.structured_formatting.secondary_text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
