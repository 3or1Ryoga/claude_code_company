'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Heart, 
  Shield, 
  Zap, 
  Target, 
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Download
} from 'lucide-react'

interface V0Section {
  type: string
  id: string
  content: Record<string, any>
  styles?: Record<string, string>
  animation?: string
}

interface V0SectionRendererProps {
  section: V0Section
  isEditable?: boolean
  onEdit?: (sectionId: string) => void
}

export default function V0SectionRenderer({ 
  section, 
  isEditable = false, 
  onEdit 
}: V0SectionRendererProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      star: Star,
      heart: Heart,
      shield: Shield,
      zap: Zap,
      target: Target,
      users: Users,
      check: CheckCircle,
      arrow: ArrowRight,
      play: Play,
      download: Download
    }
    
    const IconComponent = icons[iconName?.toLowerCase()] || Star
    return <IconComponent className="w-6 h-6" />
  }

  const getSectionClasses = () => {
    const baseClasses = section.styles?.layout || 'p-6'
    const backgroundClasses = section.styles?.background || 'bg-white'
    const textClasses = section.styles?.text || 'text-gray-900'
    
    return `${baseClasses} ${backgroundClasses} ${textClasses} ${
      isEditable && isHovered ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    } transition-all duration-200 ${section.animation === 'fade-in' ? 'animate-in fade-in-50' : ''}`
  }

  const renderHeroSection = () => (
    <div className="text-center space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {section.content.title}
        </h1>
        {section.content.subtitle && (
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            {section.content.subtitle}
          </p>
        )}
      </div>
      
      {section.content.cta && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="text-lg px-8 py-3">
            {section.content.cta}
          </Button>
          {section.content.secondaryCta && (
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              {section.content.secondaryCta}
            </Button>
          )}
        </div>
      )}

      {section.content.features && (
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {section.content.features.slice(0, 3).map((feature: string, idx: number) => (
            <Badge key={idx} variant="secondary" className="text-sm py-2 px-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              {feature}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )

  const renderProblemSection = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
        {section.content.title}
      </h2>
      
      {section.content.subtitle && (
        <p className="text-xl text-center mb-12 opacity-80">
          {section.content.subtitle}
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {section.content.items?.map((item: string, idx: number) => (
          <Card key={idx} className="p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">{item}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderSolutionSection = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {section.content.title}
        </h2>
        {section.content.subtitle && (
          <p className="text-xl opacity-80">
            {section.content.subtitle}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {section.content.solutions?.map((solution: any, idx: number) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {getIcon(solution.icon)}
              </div>
              <h3 className="text-xl font-semibold mb-3">{solution.title}</h3>
              <p className="text-gray-600 mb-4">{solution.description}</p>
              {solution.benefits && (
                <ul className="text-sm text-left space-y-1">
                  {solution.benefits.map((benefit: string, benefitIdx: number) => (
                    <li key={benefitIdx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderFeatureSection = () => (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {section.content.title}
        </h2>
        {section.content.subtitle && (
          <p className="text-xl opacity-80 max-w-3xl mx-auto">
            {section.content.subtitle}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {section.content.features?.map((feature: any, idx: number) => (
          <div key={idx} className="text-center group">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
              {typeof feature.icon === 'string' ? (
                <span className="text-3xl">{feature.icon}</span>
              ) : (
                getIcon(feature.icon)
              )}
            </div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderOfferSection = () => (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {section.content.title}
        </h2>
        {section.content.subtitle && (
          <p className="text-xl opacity-80">
            {section.content.subtitle}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {section.content.plans?.map((plan: any, idx: number) => (
          <Card 
            key={idx} 
            className={`p-6 relative ${plan.featured ? 'ring-2 ring-blue-500 scale-105' : ''}`}
          >
            {plan.featured && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                人気プラン
              </Badge>
            )}
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-600">/{plan.period}</span>
                )}
              </div>
              
              <ul className="space-y-3 mb-6 text-left">
                {plan.features?.map((feature: string, featureIdx: number) => (
                  <li key={featureIdx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={plan.featured ? 'default' : 'outline'}
                size="lg"
              >
                {plan.cta || '選択する'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderCtaSection = () => (
    <div className="text-center max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        {section.content.title}
      </h2>
      
      {section.content.subtitle && (
        <p className="text-xl mb-8 opacity-90">
          {section.content.subtitle}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button size="lg" className="text-lg px-8 py-3">
          {section.content.cta}
        </Button>
        
        {section.content.note && (
          <p className="text-sm opacity-75">
            {section.content.note}
          </p>
        )}
      </div>

      {section.content.guarantees && (
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          {section.content.guarantees.map((guarantee: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-sm opacity-80">
              <Shield className="w-4 h-4" />
              {guarantee}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTestimonialSection = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {section.content.title}
        </h2>
        {section.content.subtitle && (
          <p className="text-xl opacity-80">
            {section.content.subtitle}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {section.content.testimonials?.map((testimonial: any, idx: number) => (
          <Card key={idx} className="p-6">
            <div className="flex mb-4">
              {[...Array(5)].map((_, starIdx) => (
                <Star 
                  key={starIdx} 
                  className={`w-5 h-5 ${starIdx < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            
            <blockquote className="text-gray-700 mb-4">
              "{testimonial.content}"
            </blockquote>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderDefaultSection = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 capitalize">{section.type}</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(section.content, null, 2)}
        </pre>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (section.type) {
      case 'hero':
        return renderHeroSection()
      case 'problem':
        return renderProblemSection()
      case 'solution':
        return renderSolutionSection()
      case 'feature':
        return renderFeatureSection()
      case 'offer':
        return renderOfferSection()
      case 'cta':
        return renderCtaSection()
      case 'testimonial':
        return renderTestimonialSection()
      default:
        return renderDefaultSection()
    }
  }

  return (
    <div
      className={getSectionClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isEditable && onEdit?.(section.id)}
      style={{ cursor: isEditable ? 'pointer' : 'default' }}
    >
      {renderSectionContent()}
      
      {isEditable && isHovered && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
          クリックして編集
        </div>
      )}
    </div>
  )
}