import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

/**
 * Props:
 * - raceCalendar: [{ label, value }]
 * - raceDates: { eventName: isoString }
 * - selectedIndex: number
 * - onSelect: (index) => void
 * - lastCompletedIndex: number (-1 if none)
 * - lockedFutureRaces: boolean (if true, future races can't be clicked)
 * - allowedFutureIndex: number | null (if set, only this future index is clickable)
 */
export default function RaceTimeline({
    raceCalendar,
    raceDates,
    selectedIndex,
    onSelect,
    lastCompletedIndex = -1,
    lockedFutureRaces = true,
    allowedFutureIndex = null,
}) {
    return (
        <div className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex justify-between items-center relative min-w-[900px] mt-4">
                    {/* Background connector line */}
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-800 -z-10 -translate-y-1/2"></div>

                    {/* Progress line */}
                    <div
                        className="absolute top-1/2 left-0 h-[2px] bg-red-600 -z-10 -translate-y-1/2 transition-all duration-500"
                        style={{
                            width: raceCalendar.length > 1
                                ? `${(Math.max(selectedIndex, 0) / (raceCalendar.length - 1)) * 100}%`
                                : "0%",
                        }}
                    ></div>

                    {raceCalendar.map((race, index) => {
                        const isPast = index <= lastCompletedIndex;
                        const isCurrent = index === selectedIndex;
                        const isFuture = index > lastCompletedIndex;
                        const isDisabled = (lockedFutureRaces && isFuture)
                            || (allowedFutureIndex !== null && isFuture && index !== allowedFutureIndex);

                        return (
                            <HoverCard key={index} openDelay={50} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <div
                                        onClick={() => !isDisabled && onSelect(index)}
                                        className={`flex flex-col items-center gap-3 group w-8 ${
                                            isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                        }`}
                                    >
                                        <span
                                            className={`text-[9px] font-black italic transition-colors ${
                                                isCurrent ? "text-red-500" : "text-zinc-600 group-hover:text-zinc-400"
                                            }`}
                                        >
                                            R{index + 1}
                                        </span>

                                        <div
                                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 flex items-center justify-center ${
                                                isCurrent
                                                    ? "border-red-600 bg-red-600 scale-125 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                                    : isPast
                                                    ? "border-red-600 bg-zinc-950"
                                                    : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                                            }`}
                                        >
                                            {isPast && !isCurrent && (
                                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                            )}
                                        </div>

                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                                isCurrent
                                                    ? "text-white"
                                                    : isPast
                                                    ? "text-zinc-400"
                                                    : "text-zinc-600 group-hover:text-zinc-400"
                                            }`}
                                        >
                                            {race.label}
                                        </span>
                                    </div>
                                </HoverCardTrigger>

                                <HoverCardContent
                                    sideOffset={15}
                                    className="w-56 bg-zinc-950 border border-zinc-800 p-4 shadow-2xl rounded-xl z-50"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-white font-black italic uppercase tracking-tighter text-lg leading-tight">
                                                {race.value}
                                            </span>
                                            <span className="text-zinc-500 text-[10px] font-bold tracking-widest mt-1">
                                                R{index + 1}
                                            </span>
                                        </div>

                                        <div className="h-px w-full bg-zinc-800/50 my-1"></div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-400 font-medium">Estado:</span>
                                            <span
                                                className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm ${
                                                    isCurrent
                                                        ? "bg-red-600 text-white"
                                                        : isPast
                                                        ? "bg-zinc-800 text-zinc-300"
                                                        : "bg-zinc-800/50 text-zinc-500"
                                                }`}
                                            >
                                                {isPast ? "Completada" : "Próxima"}
                                            </span>
                                        </div>

                                        {raceDates[race.value] && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-zinc-400 font-medium">Carrera:</span>
                                                <span className="text-[11px] text-zinc-200 font-semibold">
                                                    {new Date(raceDates[race.value]).toLocaleString(undefined, {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        timeZoneName: "short",
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
