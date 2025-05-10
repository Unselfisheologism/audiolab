'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemeToggleButton = () => {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once on mount to set the initial theme
    // Ensure this code only runs on the client
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  useEffect(() => {
    // This effect runs whenever the theme state changes
    if (theme && typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  if (theme === null) {
    // Avoid rendering button until theme is determined to prevent flash of wrong icon
    // Render a placeholder or a disabled button
    return <Button variant="outline" size="icon" aria-label="Toggle theme" disabled className="w-9 h-9"><Sun className="h-5 w-5" /></Button>;
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="w-9 h-9">
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};

export default ThemeToggleButton;
