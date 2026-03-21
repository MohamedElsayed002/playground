
import { useTypingIndicator } from "@/hooks/use-type-indicator";

interface TypingIndicatorProps {
    roomId: string
}

export function TypingIndicator({roomId}: TypingIndicatorProps) {
    const label = useTypingIndicator(roomId)
    if(!label) return null

    return (
        <div className="flex items-center gap-2 px-4 py-1 text-sm text-gray-500">
            <span className="flex gap-0.5 items-end h-4">
                {[0,1,2].map((i) => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{animationDelay: `${i * 0.15}s`}}
                    />
                ))}
            </span>
            <span className="italic">{label}</span>
        </div>
    )
}