import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!isMounted) return;
        setSuggestions(data.suggestions ?? []);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load workout suggestions.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p role="status">Loading suggestions...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><div role="alert">Unable to load workout suggestions.</div></CapabilityCard>;
  }

  if (suggestions.length === 0) {
    return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns."><p>No workout suggestions.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion) => (
          <li key={suggestion.title} className="list-group-item">
            <strong>{suggestion.title}</strong>
            {suggestion.focus ? <div>{suggestion.focus}</div> : null}
            {suggestion.reason ? <small>{suggestion.reason}</small> : null}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
