export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <div className="absolute -top-64 -right-64 w-[600px] h-[600px] rounded-full bg-burgundy-200/30 dark:bg-burgundy-900/50 blur-[120px]" />
      <div className="absolute top-1/2 -translate-y-1/2 -left-48 w-[400px] h-[400px] rounded-full bg-gold-400/20 dark:bg-gold-500/25 blur-[90px]" />
      <div className="absolute -bottom-48 right-1/4 w-[500px] h-[500px] rounded-full bg-burgundy-100/35 dark:bg-burgundy-900/45 blur-[100px]" />
    </div>
  )
}
