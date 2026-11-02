import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type: string; minutes: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!isMounted) return;
        setActivities(data.activities ?? []);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load activities.');
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
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p role="status">Loading activities...</p></CapabilityCard>;
  }

  if (error) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><div role="alert">Unable to load activities.</div></CapabilityCard>;
  }

  if (activities.length === 0) {
    return <CapabilityCard title="Activities" description="Track student activity minutes and points."><p>No activities.</p></CapabilityCard>;
  }

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${index}`} className="list-group-item">
            {activity.type} · {activity.minutes} min · {activity.points ?? 0} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
