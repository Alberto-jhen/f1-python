import { useState, useEffect } from 'react';
import { fetchYearSchedule, fetchEventRaceDate } from '@/service/apiService';

/**
 * Hook that fetches the F1 calendar and computes the next upcoming race.
 * Returns { nextRace, loading } where nextRace has:
 *   - name: event name
 *   - date: Date object (local timezone)
 *   - round: 1-indexed round number
 */
export default function useNextRace() {
    const [nextRace, setNextRace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentYear = new Date().getFullYear();

        const load = async () => {
            try {
                const data = await fetchYearSchedule(currentYear);
                if (!data?.tracks) return;

                const tracks = data.tracks.filter(t => t !== "Pre-Season Testing");

                const dateResults = await Promise.all(
                    tracks.map(t => fetchEventRaceDate(currentYear, t))
                );

                const now = new Date();

                for (let i = 0; i < dateResults.length; i++) {
                    const result = dateResults[i];
                    if (!result?.date) continue;

                    const raceDate = new Date(result.date);
                    if (raceDate > now) {
                        setNextRace({
                            name: tracks[i],
                            date: raceDate,
                            round: i + 1,
                        });
                        break;
                    }
                }
            } catch (err) {
                console.error("Error computing next race:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return { nextRace, loading };
}
