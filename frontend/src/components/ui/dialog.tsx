import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false)
        }
        if (open) window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative z-10 w-full">{children}</div>
        </div>
    )
}

function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 p-6 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("mb-4", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn("text-xl font-bold text-gray-900 dark:text-slate-100", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm text-gray-500 dark:text-slate-300 mt-1", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-slate-700", className)} {...props} />
    )
}

function DialogClose({ onClick }: { onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>
    )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose }
