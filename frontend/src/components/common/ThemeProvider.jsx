import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="parkease-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
