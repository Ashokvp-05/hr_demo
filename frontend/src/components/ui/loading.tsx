import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export function Loading({
    size = "md",
    text,
    fullScreen = false,
    className
}: LoadingProps) {
    const sizes = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };

    const content = (
        <div className={cn(
            "flex flex-col items-center justify-center gap-3",
            className
        )}>
            <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                {content}
            </div>
        );
    }

    return content;
}

// Skeleton loader for table rows
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, j) => (
                        <div
                            key={j}
                            className="h-10 bg-muted animate-pulse rounded flex-1"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Card skeleton loader
export function CardSkeleton() {
    return (
        <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </div>
    );
}
