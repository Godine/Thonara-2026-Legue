import TipsProgressProvider from '@/components/tips/TipsProgressContext'
import { LanguageProvider } from '@/components/tips/LanguageContext'

export default function TipsLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TipsProgressProvider>{children}</TipsProgressProvider>
    </LanguageProvider>
  )
}
