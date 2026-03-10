export default function AdminDesignerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {children}
    </div>
  )
}
