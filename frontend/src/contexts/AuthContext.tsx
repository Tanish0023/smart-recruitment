import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";

interface UserInfo {
    id: string;
    username: string;
    email: string;
    isRecruiter: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    skills?: unknown[];
    education?: unknown[];
    experience?: unknown[];
    projects?: unknown[];
    links?: unknown[];
    onboardingCompletedAt?: string | null;
    primaryResumeUrl?: string | null;
    profileCompletion?: number;
    profileSections?: Record<string, boolean>;
    canApply?: boolean;
    nudgeMessages?: string[];
    company?: { id: string; name: string } | null;
}

interface AuthContextType {
    token: string | null;
    user: UserInfo | null;
    login: (token: string, user: UserInfo) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem(TOKEN_KEY)
    );
    const [user, setUser] = useState<UserInfo | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    const login = useCallback((newToken: string, newUser: UserInfo) => {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{ token, user, login, logout, isAuthenticated: !!token }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
