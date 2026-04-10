import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client/react";
import {
    Rocket,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UPDATE_USERNAME } from "@/graphql/auth";

interface NavItem {
    label: string;
    to: string;
    icon: ReactNode;
}

interface DashboardLayoutProps {
    navItems?: NavItem[];
    children: ReactNode;
    title?: string;
    hideHeader?: boolean;
    sidebarContent?: ReactNode;
}

export function DashboardLayout({ navItems, children, title, hideHeader, sidebarContent }: DashboardLayoutProps) {
    const { user, token, login, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
    const [usernameInput, setUsernameInput] = useState("");
    const [usernameError, setUsernameError] = useState("");

    const [updateUsername, { loading: updatingUsername }] = useMutation(UPDATE_USERNAME, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onCompleted(data: any) {
            if (token && data?.updateUsername?.user) {
                login(token, data.updateUsername.user);
            }
            setUsernameDialogOpen(false);
            setUsernameError("");
        },
        onError(err) {
            setUsernameError(err.message);
        },
    });

    function handleLogout() {
        logout();
        navigate("/");
    }

    function handleOpenUsernameDialog() {
        setUsernameInput(user?.username ?? "");
        setUsernameError("");
        setUsernameDialogOpen(true);
    }

    function handleUpdateUsername() {
        const trimmed = usernameInput.trim().toLowerCase();
        if (!/^[a-z0-9_]+$/.test(trimmed)) {
            setUsernameError("Use only letters, numbers and underscores.");
            return;
        }
        setUsernameError("");
        updateUsername({ variables: { username: trimmed } });
    }

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : "??";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors">
            {/* Sidebar */}
            <AnimatePresence initial={false}>
                {sidebarOpen && (
                    <motion.aside
                        key="sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 265, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col z-30 h-screen sticky top-0"
                    >
                        {/* Logo & Toggle */}
                        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-gray-100 dark:border-slate-800">
                            <Link to="/" className="flex items-center gap-2">
                                <div className="bg-indigo-600 text-white p-2 rounded-xl">
                                    <Rocket size={20} />
                                </div>
                                <span className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600 whitespace-nowrap">
                                    Smart Recruit
                                </span>
                            </Link>
                            <ThemeToggle />
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                title="Collapse Sidebar"
                                className="hidden lg:block text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Menu size={18} />
                            </button>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                            {sidebarContent ? sidebarContent : (
                                navItems?.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        end
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                            }`
                                        }
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))
                            )}
                        </nav>

                        {/* User footer */}
                        <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 px-3 py-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {initials}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{user?.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenUsernameDialog}
                                className="w-full justify-start gap-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                                <Pencil className="w-4 h-4" />
                                Change username
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Floating Expand Button (when header is hidden & sidebar closed) */}
                {hideHeader && !sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="fixed top-4 left-4 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-300 hover:text-indigo-600 p-2 rounded-xl shadow-lg hover:shadow-indigo-100 transition-all active:scale-95"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Top bar */}
                {!hideHeader && (
                    <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center px-4 gap-4 sticky top-0 z-20">
                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="text-gray-500 dark:text-slate-300 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {!sidebarOpen && (
                            <Link to="/" className="flex items-center gap-2">
                                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                                    <Rocket size={16} />
                                </div>
                                <span className="text-sm font-bold text-indigo-700">Smart Recruit</span>
                            </Link>
                        )}

                        {title && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                                <span className="inline-flex items-center justify-center rounded-md bg-indigo-600 p-1 text-white">
                                    <Rocket size={12} />
                                </span>
                                <ChevronRight size={14} />
                                <span className="font-medium text-gray-700 dark:text-slate-200">{title}</span>
                            </div>
                        )}

                        <div className="ml-auto flex items-center gap-3">
                            <ThemeToggle />
                            {user?.company && (
                                <span className="hidden sm:block text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full">
                                    {user.company.name}
                                </span>
                            )}
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {initials}
                            </div>
                        </div>
                    </header>
                )}

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>

                <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change username</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">New username</label>
                            <Input
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="lowercase_username"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-400">Uppercase letters are automatically converted to lowercase.</p>
                            {usernameError && <p className="text-xs text-red-600">{usernameError}</p>}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setUsernameDialogOpen(false)}
                                disabled={updatingUsername}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleUpdateUsername}
                                disabled={updatingUsername}
                            >
                                {updatingUsername ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
