'use client'

import { useState } from 'react'
import { ChevronDown, Code, Palette, Zap, Github, Linkedin, Mail, ExternalLink } from 'lucide-react'

export default function RyogaSakaiLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-white">
              Ryoga Sakai
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#skills" className="text-gray-300 hover:text-white transition-colors">Skills</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              <ChevronDown className={`w-6 h-6 transform transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <a href="#about" className="block py-2 text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#skills" className="block py-2 text-gray-300 hover:text-white transition-colors">Skills</a>
              <a href="#contact" className="block py-2 text-gray-300 hover:text-white transition-colors">Contact</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-1">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">RS</span>
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Hello, I'm{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Ryoga Sakai
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Full-Stack Developer & Creative Problem Solver
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            I craft exceptional digital experiences through innovative web development, 
            combining cutting-edge technology with thoughtful design to bring ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
            >
              Get In Touch
            </a>
            <a
              href="#skills"
              className="border border-purple-400 text-purple-400 px-8 py-4 rounded-lg font-semibold hover:bg-purple-400 hover:text-white transition-all"
            >
              View My Work
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">About Me</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Passionate developer with a keen eye for detail and a love for creating 
              seamless user experiences that make a difference.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">My Journey</h3>
              <p className="text-gray-300 mb-6">
                With years of experience in web development, I specialize in creating 
                modern, scalable applications using the latest technologies. My passion 
                lies in solving complex problems and turning innovative ideas into reality.
              </p>
              <p className="text-gray-300 mb-6">
                I believe in continuous learning and staying up-to-date with industry trends 
                to deliver the best possible solutions for my clients and projects.
              </p>
              <div className="flex space-x-4">
                <Github className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Mail className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Projects</h4>
                <p className="text-3xl font-bold text-purple-400">50+</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Experience</h4>
                <p className="text-3xl font-bold text-purple-400">5+ Years</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Technologies</h4>
                <p className="text-3xl font-bold text-purple-400">20+</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Happy Clients</h4>
                <p className="text-3xl font-bold text-purple-400">100%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">What I Do</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              I offer a comprehensive range of development services to bring your vision to life
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-purple-400/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Full-Stack Development</h3>
              <p className="text-gray-300 mb-6">
                End-to-end web application development using modern frameworks like React, Next.js, 
                Node.js, and more.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• React & Next.js</li>
                <li>• TypeScript</li>
                <li>• Node.js & Express</li>
                <li>• Database Design</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-purple-400/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">UI/UX Design</h3>
              <p className="text-gray-300 mb-6">
                Creating intuitive and beautiful user interfaces with a focus on user experience 
                and modern design principles.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Responsive Design</li>
                <li>• Tailwind CSS</li>
                <li>• Design Systems</li>
                <li>• User Research</li>
              </ul>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-purple-400/50 transition-all group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Performance Optimization</h3>
              <p className="text-gray-300 mb-6">
                Optimizing applications for speed, SEO, and scalability to ensure the best 
                possible user experience.
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Core Web Vitals</li>
                <li>• SEO Optimization</li>
                <li>• Code Splitting</li>
                <li>• Caching Strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Let's collaborate and bring your ideas to life. I'm always excited to work on 
            new challenges and create something amazing together.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="mailto:ryoga.sakai@example.com"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Send Me an Email
            </a>
            <a
              href="#"
              className="border border-purple-400 text-purple-400 px-8 py-4 rounded-lg font-semibold hover:bg-purple-400 hover:text-white transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              View Portfolio
            </a>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400 mb-4">Connect with me on social media</p>
            <div className="flex justify-center space-x-6">
              <Github className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Mail className="w-8 h-8 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 Ryoga Sakai. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}