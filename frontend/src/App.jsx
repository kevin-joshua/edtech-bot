import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import html2pdf from 'html2pdf.js'
import axios from 'axios'

const MARKDOWN_TYPES = [
  { key: 'pre_class_content', label: 'Pre-Class Content' },
  { key: 'in_class_content', label: 'In-Class Content' },
  { key: 'post_class_content', label: 'Post-Class Content' },
]

function App() {
  const [topic, setTopic] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRaw, setShowRaw] = useState({})
  const [difficulty, setDifficulty] = useState('medium')

  const handleSend = async () => {
    if (!topic.trim()) return
    
    setLoading(true)
    setError('')
    setResponse(null)
    
    try {
      const res = await axios.post('https://edtech-bot.onrender.com/generate', { 
        topic: topic.trim(),
        difficulty: difficulty
      })
      setResponse(res.data)
    } catch (err) {
      console.error('API Error:', err)
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        err.message || 
        'Error fetching content from server'
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePDF = async (key) => {
    setTimeout(async () => {
      const element = document.getElementById(`markdown-${key}`)
      if (!element) {
        console.error(`Element with id markdown-${key} not found`)
        return
      }

      try {
        // Create a clone of the element to modify for PDF
        const pdfElement = element.cloneNode(true)
        
        // Replace modern color classes with compatible ones
        const colorReplacements = {
          'bg-blue-50': 'bg-[#EFF6FF]',
          'bg-blue-100': 'bg-[#DBEAFE]',
          'bg-blue-600': 'bg-[#2563EB]',
          'text-blue-600': 'text-[#2563EB]',
          'text-blue-800': 'text-[#1E40AF]',
          'bg-green-50': 'bg-[#F0FDF4]',
          'bg-green-100': 'bg-[#DCFCE7]',
          'bg-green-600': 'bg-[#16A34A]',
          'text-green-600': 'text-[#16A34A]',
          'text-green-700': 'text-[#15803D]',
          'bg-gray-50': 'bg-[#F9FAFB]',
          'bg-gray-100': 'bg-[#F3F4F6]',
          'bg-gray-200': 'bg-[#E5E7EB]',
          'text-gray-500': 'text-[#6B7280]',
          'text-gray-600': 'text-[#4B5563]',
          'text-gray-700': 'text-[#374151]',
          'text-gray-800': 'text-[#1F2937]',
          'border-gray-200': 'border-[#E5E7EB]',
          'border-gray-300': 'border-[#D1D5DB]',
          'border-blue-500': 'border-[#3B82F6]',
          'border-green-200': 'border-[#BBF7D0]'
        }

        // Apply color replacements
        Object.entries(colorReplacements).forEach(([oldClass, newClass]) => {
          const elements = pdfElement.getElementsByClassName(oldClass)
          Array.from(elements).forEach(el => {
            el.classList.remove(oldClass)
            el.classList.add(newClass)
          })
        })

        const options = {
          margin: 0.5,
          filename: `${topic || 'content'}_${key}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
          },
          jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'portrait'
          }
        }

        await html2pdf().set(options).from(pdfElement).save()
      } catch (err) {
        console.error('PDF generation error:', err)
        setError('Failed to generate PDF. Please try again.')
      }
    }, 100) // Ensure DOM is updated
  }

  const toggleRaw = (key) => {
    setShowRaw((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const parseContent = (rawContent) => {
    if (!rawContent) return ''
    
    // If the content is a string that looks like JSON, try to parse it
    if (typeof rawContent === 'string') {
      // Remove markdown code block syntax if present
      const cleanContent = rawContent.replace(/^```json\n|\n```$/g, '').trim()
      
      try {
        const parsed = JSON.parse(cleanContent)
        // Convert the JSON object to a formatted markdown string
        return formatJsonToMarkdown(parsed)
      } catch (e) {
        console.error('Failed to parse JSON:', e)
        return rawContent
      }
    }
    
    // If it's already an object, format it
    if (typeof rawContent === 'object') {
      return formatJsonToMarkdown(rawContent)
    }
    
    return rawContent.toString()
  }

  const formatJsonToMarkdown = (obj) => {
    let markdown = ''
    
    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object') {
          markdown += `### Item ${index + 1}\n\n`
          markdown += formatJsonToMarkdown(item)
        } else {
          markdown += `- ${item}\n`
        }
      })
      return markdown
    }
    
    // Handle objects
    for (const [key, value] of Object.entries(obj)) {
      // Convert key to title case and replace underscores with spaces
      const title = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      markdown += `## ${title}\n\n`
      
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object') {
            markdown += formatJsonToMarkdown(item)
          } else {
            markdown += `- ${item}\n`
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        markdown += formatJsonToMarkdown(value)
      } else {
        markdown += `${value}\n\n`
      }
    }
    
    return markdown
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const renderContent = (content, key) => {
    if (!content) return null
    
    let data
    try {
      // If content is a string, try to parse it as JSON
      if (typeof content === 'string') {
        // Remove markdown code block syntax if present
        const cleanContent = content.replace(/^```json\n|\n```$/g, '').trim()
        data = JSON.parse(cleanContent)
      } else {
        data = content
      }
    } catch (e) {
      console.error('Failed to parse content:', e)
      return null
    }

    switch (key) {
      case 'pre_class_content':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Overview</h3>
              <p className="text-gray-700">{data.overview}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Key Concepts</h3>
              <div className="space-y-3">
                {data.key_concepts?.map((concept, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">{concept}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Example</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 italic">{data.short_example}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Reading Materials</h3>
              <div className="space-y-3">
                {data.pre_class_reading_materials?.map((material, index) => (
                  <a 
                    key={index}
                    href={material.split(' - ')[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <p className="text-blue-600 hover:text-blue-800">{material}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Pre-Class Activities</h3>
              <div className="space-y-6">
                {data.pre_class_activities?.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-lg font-medium text-gray-800 mb-2">{activity.activity_title}</h4>
                    <p className="text-gray-600 mb-3">{activity.description}</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-line">{activity.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'in_class_content':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Learning Objectives</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.learning_objectives?.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{objective}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Materials Needed</h3>
              <div className="flex flex-wrap gap-3">
                {data.materials_needed?.map((material, index) => (
                  <div key={index} className="bg-gray-100 px-4 py-2 rounded-full text-gray-700">
                    {material}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {data.class_activities?.map((activity, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{activity.activity_title}</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {activity.duration}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Teaching Script</h4>
                    <p className="text-gray-700 whitespace-pre-line">{activity.teaching_script}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Assessment Methods</h3>
              <div className="space-y-3">
                {data.assessment_methods?.map((method, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">{method}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Summary</h3>
              <p className="text-gray-700">{data.summary}</p>
            </div>
          </div>
        )

      case 'post_class_content':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Quiz</h3>
              <div className="space-y-8">
                {data.quiz?.map((question, index) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">
                      {index + 1}. {question.question}
                    </h4>
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                            option === question.answer 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <p className={`${
                            option === question.answer 
                              ? 'text-green-700' 
                              : 'text-gray-700'
                          }`}>
                            {option}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Summary</h3>
              <p className="text-gray-700">{data.summary}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI Teaching Content Chatbot
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g., Dynamic Programming, Machine Learning, Data Structures)"
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={handleSend} 
                disabled={loading || !topic.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate Content'
                )}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDifficulty('beginner')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                  difficulty === 'beginner'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Beginner
              </button>
              <button
                onClick={() => setDifficulty('medium')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                  difficulty === 'medium'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setDifficulty('advanced')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                  difficulty === 'advanced'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {response && (
          <div className="space-y-8">
            {MARKDOWN_TYPES.map(({ key, label }) => {
              const content = response[key]
              if (!content) return null
              
              return (
                <div className="bg-white rounded-lg shadow-md overflow-hidden" key={key}>
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        {label}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleRaw(key)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                        >
                          {showRaw[key] ? '📄 Rendered' : '🔧 Raw'}
                        </button>
                        <button
                          onClick={() => handlePDF(key)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 text-sm font-medium flex items-center gap-1"
                        >
                          📄 PDF
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div 
                      id={`markdown-${key}`} 
                      className="prose prose-lg max-w-none"
                    >
                      {showRaw[key] ? (
                        <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap border">
                          {parseContent(content)}
                        </pre>
                      ) : (
                        renderContent(content, key)
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">Generating teaching content...</span>
            </div>
          </div>
        )}
        
        {!response && !loading && !error && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-lg mb-2">Ready to generate teaching content!</p>
            <p className="text-sm">Enter a topic above and click "Generate Content" to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
