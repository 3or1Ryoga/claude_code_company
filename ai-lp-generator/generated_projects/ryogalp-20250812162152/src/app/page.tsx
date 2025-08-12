import { useState } from 'react'
import { ChevronRight, Zap, Shield, Rocket, Menu, X } from 'lucide-react'

export default function RyogalpLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Ryogalp
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
              Contact
            </a>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#contact" className="block text-gray-300 hover:text-white transition-colors">
                Contact
              </a>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-8">
            <Zap className="w-4 h-4 mr-2" />
            Revolutionary Technology
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}Digital Experience
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Ryogalp empowers businesses with cutting-edge solutions that streamline workflows, 
            boost productivity, and drive unprecedented growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center">
              Start Free Trial
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Why Choose Ryogalp?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the powerful features that make Ryogalp the preferred choice 
              for forward-thinking businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Lightning Fast
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Experience unparalleled speed with our optimized infrastructure 
                that delivers results in milliseconds, not minutes.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Enterprise Security
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Bank-level encryption and security protocols ensure your data 
                remains protected with 99.9% uptime guarantee.
              </p>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-8 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-6">
                <Rocket className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Scalable Growth
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Scale effortlessly from startup to enterprise with our 
                flexible architecture that grows with your business needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of companies already using Ryogalp to revolutionize 
            their operations and achieve remarkable results.
          </p>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <div className="text-center sm:text-left">
                <div className="text-3xl font-bold text-white mb-2">
                  Start Your Journey Today
                </div>
                <div className="text-gray-300">
                  No credit card required • 14-day free trial
                </div>
              </div>
              <button className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center whitespace-nowrap">
                Get Started Now
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-white mb-4">
            Ryogalp
          </div>
          <p className="text-gray-400 mb-8">
            Transforming businesses through innovative technology solutions.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-gray-500 text-sm">
            © 2024 Ryogalp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}