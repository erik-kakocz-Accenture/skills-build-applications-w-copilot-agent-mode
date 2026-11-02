import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!isMounted) return;
        setEntries(data.leaderboard ?? []);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard.');
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
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p role="status">Loading leaderboard...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><div role="alert">Unable to load leaderboard.</div></CapabilityCard>;
  }

  if (entries.length === 0) {
    return <CapabilityCard title="Leaderboard" description="Compare team point totals."><p>No leaderboard.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.teamName}</span>
            <span>{entry.totalPoints}</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
