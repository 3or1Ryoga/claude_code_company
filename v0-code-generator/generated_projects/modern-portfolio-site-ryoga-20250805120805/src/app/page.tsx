'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Github, Linkedin, Mail, ExternalLink, Menu, X } from 'lucide-react'

export default function ModernPortfolioSite() {
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
      tech: ["Vue.js", "D3.js", "OpenWeather API", "CSS3"],
      github: "#",
      live: "#"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-sm z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Ryoga
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {['home', 'about', 'projects', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize transition-colors duration-200 ${
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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700">
            <div className="px-4 py-2 space-y-2">
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
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center relative">
        <div className="text-center px-4">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 p-1">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-4xl font-bold">R</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Ryoga
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Full-Stack Developer crafting digital experiences with modern technologies
          </p>
          
          <div className="flex justify-center space-x-6 mb-12">
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              <Github size={24} />
            </a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              <Linkedin size={24} />
            </a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              <Mail size={24} />
            </a>
          </div>
          
          <button
            onClick={() => scrollToSection('about')}
            className="animate-bounce"
          >
            <ChevronDown size={32} className="text-cyan-400" />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              About Me
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                I'm a passionate full-stack developer with 5+ years of experience building 
                scalable web applications. I love turning complex problems into simple, 
                beautiful designs.
              </p>
              
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                When I'm not coding, you can find me exploring new technologies, 
                contributing to open source projects, or enjoying a good cup of coffee.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-cyan-400 mb-2">Frontend</h3>
                  <p className="text-sm text-slate-300">React, Next.js, Vue.js, TypeScript</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-cyan-400 mb-2">Backend</h3>
                  <p className="text-sm text-slate-300">Node.js, Python, PostgreSQL, MongoDB</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                <div className="text-6xl">👨‍💻</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Featured Projects
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="bg-slate-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
                <div className="h-48 bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-400">Project Image</span>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                  <p className="text-slate-300 mb-4">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        className="px-3 py-1 bg-slate-700 text-cyan-400 text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex space-x-4">
                    <a
                      href={project.github}
                      className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      <Github size={16} />
                      <span>Code</span>
                    </a>
                    <a
                      href={project.live}
                      className="flex items-center space-x-2 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      <ExternalLink size={16} />
                      <span>Live</span>
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
          <h2 className="text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Get In Touch
            </span>
          </h2>
          
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            I'm always open to discussing new opportunities and interesting projects. 
            Let's create something amazing together!
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-slate-800 p-6 rounded-lg">
              <Mail className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-slate-300">ryoga@example.com</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <Github className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">GitHub</h3>
              <p className="text-slate-300">@ryoga-dev</p>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
              <Linkedin className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">LinkedIn</h3>
              <p className="text-slate-300">ryoga-developer</p>
            </div>
          </div>
          
          <button className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Let's Talk
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400">
            © 2024 Ryoga. Built with Next.js and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  )
}