'use client'

import { useState } from 'react'
import { ArrowRight, Shield, Zap, Target, Menu, X } from 'lucide-react'

export default function RyogaLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Ryoga<span className="text-purple-400">_2</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
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
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="block text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#contact" className="block text-gray-300 hover:text-white transition-colors">Contact</a>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
              Next Generation Platform
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Digital Experience
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Ryoga_2 delivers cutting-edge solutions that revolutionize how you interact with technology. 
            Experience the future today with our advanced platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105">
              Start Your Journey
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the capabilities that make Ryoga_2 the ultimate choice for modern digital solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-purple-600/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition-colors">
                <Shield className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Advanced Security</h3>
              <p className="text-gray-300 leading-relaxed">
                Enterprise-grade security protocols ensure your data remains protected with state-of-the-art encryption and monitoring systems.
              </p>
            </div>

            <div className="group bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-purple-600/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition-colors">
                <Zap className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
              <p className="text-gray-300 leading-relaxed">
                Optimized performance delivers blazing-fast response times and seamless user experiences across all devices and platforms.
              </p>
            </div>

            <div className="group bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="bg-purple-600/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600/30 transition-colors">
                <Target className="text-purple-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Precision Targeting</h3>
              <p className="text-gray-300 leading-relaxed">
                AI-powered analytics and targeting capabilities help you reach the right audience with pinpoint accuracy and maximum impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              The Future?
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of satisfied users who have already transformed their digital experience with Ryoga_2. 
            Start your journey today and unlock unlimited possibilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105 shadow-lg hover:shadow-purple-500/25">
              Get Started Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            <button className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-10 py-4 rounded-lg text-lg font-semibold transition-colors">
              Learn More
            </button>
          </div>
          
          <div className="mt-12 text-sm text-gray-400">
            <p>No credit card required • Free 14-day trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold text-white mb-4">
            Ryoga<span className="text-purple-400">_2</span>
          </div>
          <p className="text-gray-400 mb-6">
            Transforming digital experiences, one innovation at a time.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-gray-500 text-sm">
            © 2024 Ryoga_2. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}