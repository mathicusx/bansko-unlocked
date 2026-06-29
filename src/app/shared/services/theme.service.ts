import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private readonly storageKey = 'enduro-theme';

  // Default theme subject
  private currentThemeSubject = new BehaviorSubject<Theme>('dark');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    const savedTheme = this.getStoredTheme();
    // const systemTheme = this.getSystemTheme();
    // const initialTheme = savedTheme ;

    this.setTheme(savedTheme || 'dark');
  }

  /**
   * Get theme from localStorage
   */
  private getStoredTheme(): Theme | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(this.storageKey);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  /**
   * Get system theme preference
   */
  // private getSystemTheme(): Theme {
  //   if (typeof window === 'undefined') return 'dark';

  //   return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  // }

  /**
   * Set theme and update DOM
   */
  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.updateThemeInDOM(theme);
    this.saveTheme(theme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme = this.getCurrentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Check if current theme is light
   */
  isLightTheme(): boolean {
    return this.getCurrentTheme() === 'light';
  }

  /**
   * Update DOM with theme attribute
   */
  private updateThemeInDOM(theme: Theme): void {
    if (typeof document === 'undefined') return;

    // Remove existing theme attributes
    this.renderer.removeAttribute(document.documentElement, 'data-theme');

    // Set new theme attribute
    this.renderer.setAttribute(document.documentElement, 'data-theme', theme);

    // Also update body class for legacy support
    this.renderer.removeClass(document.body, 'light-theme');
    this.renderer.removeClass(document.body, 'dark-theme');
    this.renderer.addClass(document.body, `${theme}-theme`);
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, theme);
  }

  /**
   * Listen for system theme changes
   */
  watchSystemTheme(): void {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    mediaQuery.addEventListener('change', (e) => {
      // Only update if user hasn't manually set a theme
      const storedTheme = this.getStoredTheme();
      if (!storedTheme) {
        const systemTheme = e.matches ? 'light' : 'dark';
        this.setTheme(systemTheme);
      }
    });
  }

  /**
   * Reset theme to system preference
   */
  // resetToSystemTheme(): void {
  //   if (typeof localStorage !== 'undefined') {
  //     localStorage.removeItem(this.storageKey);
  //   }
  //   const systemTheme = this.getSystemTheme();
  //   this.setTheme(systemTheme);
  // }

  /**
   * Get theme-specific CSS variable value
   */
  getThemeVariable(variableName: string): string {
    if (typeof document === 'undefined') return '';

    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }

  /**
   * Set theme-specific CSS variable
   */
  setThemeVariable(variableName: string, value: string): void {
    if (typeof document === 'undefined') return;

    document.documentElement.style.setProperty(variableName, value);
  }
}
