'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Github, Linkedin, Mail, ExternalLink, Menu, X } from 'lucide-react'

export default function ModernPortfolio() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'projects', 'contact']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const projects = [
    {
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce solution with React, Node.js, and PostgreSQL",
      image: "/api/placeholder/400/250",
      tech: ["React", "Node.js", "PostgreSQL", "Stripe"],
      github: "#",
      live: "#"
    },
    {
      title: "Task Management App",
      description: "Collaborative task management tool with real-time updates",
      image: "/api/placeholder/400/250",
      tech: ["Next.js", "Socket.io", "MongoDB", "Tailwind"],
      github: "#",
      live: "#"
    },
    {
      title: "Weather Dashboard",
      description: "Interactive weather dashboard with data visualization",
      image: "/api/placeholder/400/250",
      tech: ["Vue.js", "D3.js", "OpenWeather API", "Chart.js"],
      github: "#",
      live: "#"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/90 backdrop-blur-sm z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Portfolio
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {['home', 'about', 'projects', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize transition-colors ${
                    activeSection === item
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800">
              {['home', 'about', 'projects', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left py-2 capitalize text-slate-300 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 p-1">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <span className="text-4xl font-bold">JD</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              John Doe
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8">
            Full Stack Developer & UI/UX Designer
          </p>
          
          <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
            I create beautiful, functional, and user-centered digital experiences that solve real-world problems.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => scrollToSection('projects')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all transform hover:scale-105"
            >
              View My Work
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="px-8 py-3 border border-slate-600 rounded-lg font-semibold hover:border-slate-400 transition-colors"
            >
              Get In Touch
            </button>
          </div>
          
          <div className="animate-bounce">
            <ChevronDown size={32} className="mx-auto text-slate-400" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              About Me
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-slate-300 mb-6">
                I'm a passionate full-stack developer with 5+ years of experience creating digital solutions 
                that bridge the gap between design and functionality. I love turning complex problems into 
                simple, beautiful, and intuitive solutions.
              </p>
              
              <p className="text-lg text-slate-300 mb-8">
                When I'm not coding, you can find me exploring new technologies, contributing to open-source 
                projects, or sharing my knowledge through technical writing and mentoring.
              </p>
              
              <div className="flex flex-wrap gap-3">
                {['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB'].map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-slate-800 rounded-full text-sm font-medium border border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-400/20 p-8">
                <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center">
                  <span className="text-6xl">👨‍💻</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Featured Projects
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all transform hover:scale-105"
              >
                <div className="aspect-video bg-slate-700 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 flex items-center justify-center">
                    <span className="text-4xl">🚀</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                  <p className="text-slate-300 mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-slate-700 rounded text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-4">
                    <a
                      href={project.github}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      <Github size={16} />
                      Code
                    </a>
                    <a
                      href={project.live}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                      Live Demo
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Let's Work Together
            </span>
          </h2>
          
          <p className="text-xl text-slate-300 mb-12">
            I'm always interested in new opportunities and exciting projects. 
            Let's discuss how we can bring your ideas to life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <a
              href="mailto:john@example.com"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition-all transform hover:scale-105"
            >
              <Mail size={20} />
              Send Email
            </a>
            
            <div className="flex gap-4 justify-center">
              <a
                href="#"
                className="p-4 border border-slate-600 rounded-lg hover:border-slate-400 transition-colors"
              >
                <Github size={24} />
              </a>
              <a
                href="#"
                className="p-4 border border-slate-600 rounded-lg hover:border-slate-400 transition-colors"
              >
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p>&copy; 2024 John Doe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
