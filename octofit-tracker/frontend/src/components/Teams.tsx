import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!isMounted) return;
        setTeams(data.teams ?? []);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load teams.');
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
    return <CapabilityCard title="Teams" description="Manage teams and members."><p role="status">Loading teams...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><div role="alert">Unable to load teams.</div></CapabilityCard>;
  }

  if (teams.length === 0) {
    return <CapabilityCard title="Teams" description="Manage teams and members."><p>No teams.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      <ul className="list-group list-group-flush">
        {teams.map((team) => (
          <li key={team.name} className="list-group-item">
            <strong>{team.name}</strong>
            <div>{team.members.join(', ') || 'No members yet'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
