import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState<boolean>(() => {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored !== null) {
            return stored === "dark";
        }
        // Keep existing app look unless the user explicitly enables dark mode.
        return false;
    });

    useEffect(() => {
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
