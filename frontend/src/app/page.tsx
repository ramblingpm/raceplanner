import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Race Planner
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            Calculate your cycling race times and required speeds for optimal
            performance
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors text-lg font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium border-2 border-primary-600"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🚴</div>
              <h3 className="text-xl font-semibold mb-2">Plan Your Race</h3>
              <p className="text-gray-600">
                Enter your race details and planned start time
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">
                Calculate Results
              </h3>
              <p className="text-gray-600">
                Get your finish time and required average speed
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">View Race Map</h3>
              <p className="text-gray-600">
                See your race route on an interactive map
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
