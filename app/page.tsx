'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, RotateCcw, CheckCircle, Shield, Monitor, Phone, Wifi, Lock, Users, Building2, Heart, Scale, DollarSign, Hammer, TreePine } from 'lucide-react'

const STORAGE_KEY = 'cn_wizard_state'

type Answer = { question: string; answer: string; value: string }
type Step = 'chat' | 'capture' | 'result'

const questions = [
  {
    id: 'reason',
    message: "Hi! I'm here to help match you with the right IT solution. Let's start simple — **what brings you here today?**",
    options: [
      { label: 'My IT keeps breaking — I need reliable support', value: 'reliability', icon: '🔧' },
      { label: "I'm worried about a cyberattack or data breach", value: 'security', icon: '🛡️' },
      { label: 'I need to get HIPAA compliant', value: 'hipaa', icon: '📋' },
      { label: "I'm paying too much for IT and not getting enough", value: 'cost', icon: '💸' },
      { label: "I'm opening a new location or growing fast", value: 'growth', icon: '📈' },
      { label: "I just want to see what's out there", value: 'exploring', icon: '👀' },
    ],
  },
  {
    id: 'industry',
    message: "Got it. **What kind of organization are you?**",
    options: [
      { label: 'Behavioral Health / Mental Health', value: 'behavioral_health', icon: '🧠' },
      { label: 'Healthcare / Medical', value: 'healthcare', icon: '⚕️' },
      { label: 'Law Firm / Legal Services', value: 'legal', icon: '⚖️' },
      { label: 'Financial Services', value: 'financial', icon: '💰' },
      { label: 'Construction / Trades', value: 'construction', icon: '🏗️' },
      { label: 'Golf Course / Hospitality / RV Park', value: 'hospitality', icon: '⛳' },
      { label: 'Professional Services', value: 'professional', icon: '🏢' },
      { label: 'Other', value: 'other', icon: '📦' },
    ],
  },
  {
    id: 'size',
    message: "**How many people are on your team?**",
    options: [
      { label: '1–10 employees', value: 'micro', icon: '👤' },
      { label: '11–30 employees', value: 'small', icon: '👥' },
      { label: '31–100 employees', value: 'medium', icon: '🏢' },
      { label: '100+ employees', value: 'large', icon: '🏙️' },
    ],
  },
  {
    id: 'pain',
    message: "Last one — **what's your biggest IT headache right now?**",
    options: [
      { label: 'Slow or unreliable computers and internet', value: 'performance', icon: '🐌' },
      { label: 'No real IT support when things break', value: 'support', icon: '🆘' },
      { label: 'Security and compliance gaps', value: 'compliance', icon: '🔓' },
      { label: 'Too many vendors and no one in charge', value: 'vendors', icon: '🤯' },
      { label: 'Remote workers with no IT support', value: 'remote', icon: '🏠' },
      { label: 'Not sure — I need someone to assess us', value: 'assessment', icon: '🔍' },
    ],
  },
]

function getRecommendation(answers: Answer[]) {
  const reason = answers.find((a: any) => a.id === 'reason')?.value
  const industry = answers.find((a: any) => a.id === 'industry')?.value
  const size = answers.find((a: any) => a.id === 'size')?.value
  const pain = answers.find((a: any) => a.id === 'pain')?.value

  const isHealthcare = industry === 'behavioral_health' || industry === 'healthcare'
  const needsSecurity = reason === 'security' || pain === 'compliance' || reason === 'hipaa'
  const isLarge = size === 'large' || size === 'medium'

  if (isHealthcare && (needsSecurity || reason === 'hipaa')) {
    return {
      plan: '+ Compliance',
      color: '#dc2626',
      tagline: 'Full HIPAA compliance built in.',
      why: "Based on your answers, you're in a regulated healthcare environment that needs both strong IT management and formal HIPAA compliance support. Our + Compliance plan includes everything from EHR/EMR support to risk assessments, policy templates, and AHCA readiness — built specifically for organizations like yours.",
      includes: [
        'Microsoft 365 Business Premium + EHR/EMR Support',
        'Unlimited Help Desk — 24×7',
        'Avanan Email Security + Dropsuite Backup',
        'Security Awareness Training & Phishing Simulations',
        'HIPAA Risk Assessments & Policy Templates',
        'Quarterly Compliance Meetings',
        'AHCA Readiness Support',
        'Executive Compliance Reporting',
      ],
      urgency: "Healthcare organizations are the #1 target for ransomware. The average HIPAA fine is $1.2M. Every day without a compliance program is a liability.",
    }
  }

  if (needsSecurity || isLarge) {
    return {
      plan: '+ Security',
      color: '#059669',
      tagline: 'Managed IT plus a proactive security layer.',
      why: "Based on your answers, your organization needs more than just day-to-day IT support — you need a security program running in the background, watching for threats before they become incidents. Our + Security plan adds phishing simulations, dark web monitoring, and quarterly security reviews on top of our full managed IT foundation.",
      includes: [
        'Microsoft 365 Business Premium',
        'Unlimited Help Desk — 24×7',
        'Avanan Email Security + Dropsuite Backup',
        'Security Awareness Training',
        'Phishing Simulations',
        'Dark Web Monitoring',
        'Quarterly Security Reviews',
        'Security Reporting & Score Tracking',
      ],
      urgency: "60% of small businesses close within 6 months of a cyberattack. Security isn't a nice-to-have — it's survival.",
    }
  }

  return {
    plan: 'Managed IT',
    color: '#0057b8',
    tagline: 'Everything you need to run your business technology.',
    why: "Based on your answers, our core Managed IT plan is a great starting point. You'll get enterprise-grade IT management, unlimited help desk support, Microsoft 365, email security, backups, and 24×7 NOC monitoring — all for a flat monthly rate with no surprises.",
    includes: [
      'Microsoft 365 Business Premium',
      'Unlimited Help Desk — 24×7',
      'Microsoft 365 Administration',
      'Intune Device Management',
      'Avanan Email Security',
      'Dropsuite Backup & Recovery',
      'Network & Wi-Fi Monitoring',
      'Vendor Management',
      'User Onboarding & Offboarding',
    ],
    urgency: "Most businesses that switch to managed IT save 30–40% vs. break-fix IT while getting significantly better coverage and response times.",
  }
}

type AnswerWithId = Answer & { id: string }

type Message =
  | { type: 'bot'; text: string; questionIndex?: number }
  | { type: 'user'; text: string }

export default function WizardPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<AnswerWithId[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [step, setStep] = useState<Step>('chat')
  const [typing, setTyping] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', org: '' })
  const [submitted, setSubmitted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        setMessages(state.messages || [])
        setAnswers(state.answers || [])
        setCurrentQ(state.currentQ ?? 0)
        setStep(state.step || 'chat')
        setForm(state.form || { firstName: '', lastName: '', email: '', phone: '', org: '' })
        setSubmitted(state.submitted || false)
        return
      }
    } catch {}
    // Fresh start — show first message
    setTimeout(() => addBotMessage(questions[0].message, 0), 600)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, answers, currentQ, step, form, submitted }))
    } catch {}
  }, [messages, answers, currentQ, step, form, submitted])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function addBotMessage(text: string, questionIndex?: number) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { type: 'bot', text, questionIndex }])
    }, 900)
  }

  function handleAnswer(option: { label: string; value: string; icon: string }, qIndex: number) {
    const q = questions[qIndex]
    const newAnswer: AnswerWithId = { id: q.id, question: q.message, answer: option.label, value: option.value }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)
    setMessages(prev => [...prev, { type: 'user', text: `${option.icon} ${option.label}` }])

    const next = qIndex + 1
    if (next < questions.length) {
      setCurrentQ(next)
      addBotMessage(questions[next].message, next)
    } else {
      // All questions answered
      setTimeout(() => {
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setMessages(prev => [...prev, {
            type: 'bot',
            text: "Perfect — I have everything I need. Based on your answers, I have a recommendation ready for you. Before I show you, can I grab your contact info so we can follow up with a custom quote?",
          }])
          setTimeout(() => setStep('capture'), 800)
        }, 1000)
      }, 400)
    }
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY)
    setMessages([])
    setAnswers([])
    setCurrentQ(0)
    setStep('chat')
    setForm({ firstName: '', lastName: '', email: '', phone: '', org: '' })
    setSubmitted(false)
    setTimeout(() => addBotMessage(questions[0].message, 0), 600)
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setStep('result')
  }

  function skipCapture() {
    setStep('result')
  }

  const recommendation = answers.length === questions.length ? getRecommendation(answers) : null

  return (
    <div className="min-h-screen bg-[#071524] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0057b8] flex items-center justify-center text-sm font-bold">CN</div>
          <div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Charlie&apos;s Nerds</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">IT Advisor · Online</span>
            </div>
          </div>
        </div>
        <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <RotateCcw size={13} />
          Start over
        </button>
      </div>

      {/* Progress */}
      {step === 'chat' && (
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div key={i} className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: i < answers.length ? '24px' : '8px',
                    background: i < answers.length ? '#0057b8' : 'rgba(255,255,255,0.15)',
                  }} />
              ))}
            </div>
            <span className="text-xs text-slate-500">{answers.length} of {questions.length}</span>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`animate-fade-up flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${i * 0.05}s` }}>
            {msg.type === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-[#0057b8] flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0">CN</div>
            )}
            <div className="max-w-[85%]">
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.type === 'bot'
                  ? 'bg-white/8 text-slate-200 rounded-tl-sm'
                  : 'bg-[#0057b8] text-white rounded-tr-sm'
              }`}
                dangerouslySetInnerHTML={{
                  __html: msg.type === 'bot'
                    ? msg.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    : msg.text
                }}
              />

              {/* Options for this message */}
              {msg.type === 'bot' && msg.questionIndex !== undefined && msg.questionIndex === answers.length && step === 'chat' && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {questions[msg.questionIndex].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt, msg.questionIndex!)}
                      className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-white/15 text-sm text-slate-300 hover:border-[#0057b8] hover:bg-[#0057b8]/15 hover:text-white transition-all group"
                    >
                      <span className="text-lg flex-shrink-0">{opt.icon}</span>
                      <span className="flex-1">{opt.label}</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-[#0057b8] transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-[#0057b8] flex items-center justify-center text-xs font-bold flex-shrink-0">CN</div>
            <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lead capture form */}
        {step === 'capture' && !typing && (
          <div className="animate-fade-up mt-2">
            <div className="bg-white/6 border border-white/15 rounded-2xl p-5">
              <div className="text-sm text-slate-300 mb-4 leading-relaxed">
                Your recommendation is ready — just one quick step first.
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                    <input required type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="Jane"
                      className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                    <input required type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Smith"
                      className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Work Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@yourcompany.com"
                    className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000"
                    className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Organization</label>
                  <input type="text" value={form.org} onChange={e => setForm({...form, org: e.target.value})} placeholder="Your Company Name"
                    className="w-full px-3 py-2.5 bg-white/8 border border-white/15 rounded-xl text-sm text-white placeholder-slate-600 outline-none focus:border-[#0057b8] focus:ring-1 focus:ring-[#0057b8] transition-all" />
                </div>
                <button type="submit"
                  className="w-full py-3 bg-[#0057b8] text-white font-bold rounded-xl hover:bg-[#1d6fd4] transition-all text-sm">
                  Show My Recommendation →
                </button>
                <button type="button" onClick={skipCapture}
                  className="w-full py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                  Skip for now
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && recommendation && (
          <div className="animate-fade-up mt-2 space-y-4">
            {/* Result card */}
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: recommendation.color + '40' }}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center gap-3" style={{ background: recommendation.color }}>
                <CheckCircle size={20} className="text-white flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white/75 uppercase tracking-wider">Recommended Plan</div>
                  <div className="text-lg font-extrabold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{recommendation.plan}</div>
                </div>
              </div>

              {/* Why */}
              <div className="px-5 py-4 bg-white/5 border-b border-white/10">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Why this plan</div>
                <p className="text-sm text-slate-300 leading-relaxed">{recommendation.why}</p>
              </div>

              {/* Includes */}
              <div className="px-5 py-4 bg-white/3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What&apos;s included</div>
                <ul className="space-y-2">
                  {recommendation.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: recommendation.color }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Urgency */}
              <div className="px-5 py-3 border-t border-white/10" style={{ background: recommendation.color + '15' }}>
                <p className="text-xs leading-relaxed" style={{ color: recommendation.color }}>
                  💡 {recommendation.urgency}
                </p>
              </div>
            </div>

            {/* Your answers summary */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your answers</div>
              <div className="space-y-1.5">
                {answers.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs text-slate-400">
                    <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-slate-600" />
                    {a.answer}
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pb-6">
              {submitted ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-green-400">Request received!</div>
                    <div className="text-xs text-slate-500 mt-0.5">A real technician will be in touch within one business day.</div>
                  </div>
                </div>
              ) : (
                <a href="https://charliesnerds.com/contact"
                  className="flex items-center justify-center gap-2 w-full py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 hover:opacity-90"
                  style={{ background: recommendation.color }}>
                  Get a Custom Quote for This Plan →
                </a>
              )}
              <a href="tel:18002417333"
                className="flex items-center justify-center gap-2 w-full py-3 border border-white/15 text-slate-300 font-semibold rounded-xl text-sm hover:border-white/30 hover:text-white transition-all">
                📞 Call 1-800-241-7333
              </a>
              <button onClick={handleReset}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                <RotateCcw size={12} />
                Start over with different answers
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="border-t border-white/8 px-6 py-3 text-center">
        <p className="text-xs text-slate-600">
          Charlie&apos;s Nerds LLC · <a href="https://charliesnerds.com" className="hover:text-slate-400 transition-colors">charliesnerds.com</a> · 1-800-241-7333
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
