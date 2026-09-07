import { useState, useEffect } from 'react';
import { getRacesBySeason } from '@/service/apiService';

/**
 * Hook that fetches the F1 race calendar from the backend and computes the
 * next upcoming race. The backend is the single source of truth for the
 * real round numbers and race dates stored in the database.
 * Returns { nextRace, loading } where nextRace has:
 *   - name: event name
 *   - date: Date object (race_date from the database)
 *   - round: real round number from the database
 */
export default function useNextRace() {
    const [nextRace, setNextRace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentYear = new Date().getFullYear();

        const load = async () => {
            try {
                const races = await getRacesBySeason(currentYear);
                if (!Array.isArray(races) || races.length === 0) return;

                const now = new Date();

                const upcoming = races
                    .map(r => ({ ...r, raceDate: new Date(r.race_date) }))
                    .filter(r => !isNaN(r.raceDate) && r.raceDate > now)
                    .sort((a, b) => a.raceDate - b.raceDate)[0];

                if (upcoming) {
                    setNextRace({
                        name: upcoming.name,
                        date: upcoming.raceDate,
                        round: upcoming.round,
                    });
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
