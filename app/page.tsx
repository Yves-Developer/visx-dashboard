import PerformanceDashboard from "@/performance-chart-v2"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#121212]">
      <div className="w-full max-w-6xl">
        <div className="flex items-center mb-6">
          <h1 className="text-xl font-bold text-white">LiveKit</h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-2">
            <svg
              className="mr-2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 9l-7 7-7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-lg font-medium text-gray-300">Publishers</h2>
          </div>
          <PerformanceDashboard />
        </div>

        <div>
          <div className="flex items-center mb-2">
            <svg
              className="mr-2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 9l-7 7-7-7" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-lg font-medium text-gray-300">Subscribers</h2>
          </div>
        </div>
      </div>
    </main>
  )
}
