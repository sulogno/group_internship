import Link from "next/link";
import { Users, Sparkles, Shield, MessageSquare, Target, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-fuchsia-300/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-200/20 to-fuchsia-200/20 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">Groupify</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 px-6 md:px-12">
        <section className="max-w-6xl mx-auto pt-20 pb-32 md:pt-32">
          <div className="text-center space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-violet-200 text-sm font-medium text-violet-700 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Smart Group Formation for Students
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-violet-800 to-fuchsia-800 bg-clip-text text-transparent leading-tight">
              Find your people.
              <br />
              Build your team.
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
              The intelligent platform for college students to form internship training groups with transparency, fairness, and zero chaos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link 
                href="/signup" 
                className="group px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
              >
                Start Forming Groups
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                I Have an Account
              </Link>
            </div>
          </div>

          <div className="mt-24 grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Smart Matching", desc: "AI-powered suggestions based on your skills and interests", color: "violet" },
              { icon: Shield, title: "Fair & Transparent", desc: "Application-based joining ensures no one gets left behind", color: "fuchsia" },
              { icon: MessageSquare, title: "Built-in Chat", desc: "Private group discussions with announcements & resources", color: "purple" },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Internship Clusters</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Choose your path and find teammates who share your passion</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Generative AI", icon: "🤖", gradient: "from-purple-500 to-indigo-600" },
              { name: "Full Stack + Java", icon: "☕", gradient: "from-orange-500 to-red-500" },
              { name: "Python + ML + Cloud", icon: "🐍", gradient: "from-green-500 to-teal-500" },
              { name: "ML + Cloud Security", icon: "🔐", gradient: "from-blue-500 to-cyan-500" },
              { name: "Cloud Computing", icon: "☁️", gradient: "from-sky-500 to-blue-500" },
            ].map((cluster) => (
              <div 
                key={cluster.name}
                className="group relative p-5 bg-white rounded-xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cluster.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{cluster.icon}</span>
                  <span className="font-semibold text-gray-900">{cluster.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto pb-32">
          <div className="relative p-8 md:p-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTIgMi00IDItMi0yLTItMiAyIDQgNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
            <div className="relative z-10 text-center text-white">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Deadline Approaching!</h2>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">Form your groups before the deadline. No switching or leaving after the cutoff date.</p>
              <Link 
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-700 font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                Create Your Account Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-semibold">Groupify Campus</span>
          </div>
          <p className="text-sm text-gray-500">Find your people. Build your team. Learn together.</p>
        </div>
      </footer>
    </div>
  );
}
