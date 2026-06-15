import TipsProgressProvider from '@/components/tips/TipsProgressContext'

export default function TipsLayout({ children }: { children: React.ReactNode }) {
  return <TipsProgressProvider>{children}</TipsProgressProvider>
}
