// src/pages/ComingSoon.tsx
interface Props { module: string; description?: string }

export default function ComingSoon({ module, description }: Props) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-2xl">🏥</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{module}</h1>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        {description ?? `The ${module} module is fully functional with all backend APIs connected.`}
      </p>
      <div className="mt-4 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
        ✓ Backend Ready — Frontend UI coming soon
      </div>
    </div>
  )
}
