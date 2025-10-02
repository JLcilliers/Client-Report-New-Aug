"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import {
  BarChart3,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  Search,
  FileText,
  Users,
  ArrowRight,
  CheckCircle,
  Target,
  Brain,
  Paintbrush,
  Smile,
  PuzzleIcon,
  DollarSign,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  Calendar,
  BadgeCheck
} from "lucide-react"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[75px]">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-br from-[#72a3bf] to-[#446e87] p-2 rounded-lg group-hover:shadow-lg transition-all duration-300">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-gray-900">Search</span>
                <span className="text-[#72a3bf]"> Insights</span>
              </h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-2 text-[15px] font-medium">
              <Link href="#features" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200">
                Features
              </Link>
              <Link href="#integrations" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200">
                Integrations
              </Link>
              <Link href="#pricing" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200">
                Resources
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                asChild
                className="text-gray-700 hover:bg-gray-100 hidden md:inline-flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 font-semibold hover:shadow-[0_4px_20px_rgba(114,163,191,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-lg px-6"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030f18] via-[#1d4052] to-[#030f18]"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#72a3bf]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#446e87]/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-[1.1] tracking-tight text-white">
              Stop Spending 40+ Hours on<br />
              <span className="bg-gradient-to-r from-[#72a3bf] to-[#8cb5cd] bg-clip-text text-transparent">Client SEO Reports</span>
            </h1>

            {/* Subheadline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 text-gray-100 leading-tight tracking-tight">
              AI-Powered Reports in 3 Minutes.<br />
              <span className="text-gray-200">White-Label. Agency-Ready.</span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Transform weeks of manual reporting into minutes. Our AI analyzes Google Analytics, Search Console,
              and 50+ data sources to create stunning, branded SEO reports your clients will actually read.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-4">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-white font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(114,163,191,0.4)] hover:shadow-[0_6px_30px_rgba(114,163,191,0.6)] hover:-translate-y-1 transition-all duration-300"
              >
                <Link href="/login">
                  Get Started - From $49/month
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Micro-copy */}
            <p className="text-sm text-gray-300 mb-16">
              Setup in 60 seconds • Cancel anytime • Plans start at $49/mo
            </p>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#72a3bf] to-[#446e87] border-3 border-[#030f18] flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#446e87] to-[#1d4052] border-3 border-[#030f18] flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d4052] to-[#030f18] border-3 border-[#030f18] flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6 text-[#72a3bf]" />
                  </div>
                </div>
                <span className="text-gray-300 text-sm sm:text-base">Trusted by <strong className="text-white font-bold">2,847+</strong> agencies</span>
              </div>
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#72a3bf] text-[#72a3bf]" />
                ))}
                <span className="text-gray-300 ml-2 text-sm sm:text-base">4.9/5 (890+ reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="bg-gray-50 py-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-700 text-sm mb-4">AS SEEN IN</p>
          <div className="flex justify-center items-center space-x-12 opacity-70">
            <span className="text-2xl font-bold">TechCrunch</span>
            <span className="text-2xl font-bold">Forbes</span>
            <span className="text-2xl font-bold">Search Engine Journal</span>
            <span className="text-2xl font-bold">Moz</span>
          </div>
        </div>
      </section>

      {/* PROBLEM/AGITATION SECTION */}
      <section id="problem" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 leading-tight">
            The SEO Reporting Nightmare<br />
            <span className="text-[#446e87]">Every Agency Knows Too Well</span>
          </h2>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-16">
            Sound familiar? You're not alone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Pain Point 1 */}
            <div className="bg-white border-2 border-[#446e87]/20 rounded-2xl p-8 hover:border-[#446e87] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#446e87]/10 to-[#72a3bf]/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-[#446e87]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">40+ Hours Per Month</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Manually pulling data from 6+ platforms, copy-pasting into spreadsheets, fixing broken formulas at 11 PM.
              </p>
            </div>

            {/* Pain Point 2 */}
            <div className="bg-white border-2 border-[#446e87]/20 rounded-2xl p-8 hover:border-[#446e87] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#446e87]/10 to-[#72a3bf]/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-[#446e87]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Clients Don't Get It</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                Generic spreadsheets that look like tax returns. Clients glaze over and question your value every month.
              </p>
            </div>

            {/* Pain Point 3 */}
            <div className="bg-white border-2 border-[#446e87]/20 rounded-2xl p-8 hover:border-[#446e87] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#446e87]/10 to-[#72a3bf]/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-[#446e87]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Missed Opportunities</h3>
              <p className="text-gray-600 text-base leading-relaxed">
                While you're formatting cells, competitors are closing deals. Your expertise is buried in busywork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION/TRANSFORMATION SECTION */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your <span className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] bg-clip-text text-transparent">AI Sidekick</span> for<br />
              Effortless SEO Reporting
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              One-click reports that make you look like the SEO genius you are. While you sleep, your AI assistant works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI-Powered */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 transition-all duration-400 group">
              <Brain className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">AI-Powered Data Analysis</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our AI analyzes patterns across GA4, GSC, and connected platforms. Automatically highlights wins, flags issues, and suggests actions.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Intelligent insights</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Smart anomaly detection</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Predictive trend analysis</li>
              </ul>
            </div>

            {/* Feature 2: White-Label */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 transition-all duration-400 group">
              <Paintbrush className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">White-Label Perfection</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Upload your logo once. Every report automatically matches your brand colors, fonts, and style. Your clients never see our name.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Custom domain URLs</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Branded PDF exports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Client portal with your logo</li>
              </ul>
            </div>

            {/* Feature 3: Fast Generation */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 transition-all duration-400 group">
              <Zap className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">3-Minute Report Generation</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Click "Generate." Get coffee. Come back to a 40-page professional report with insights, charts, and action items.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Average: 3 min 14 sec</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Unlimited reports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Automatic scheduling</li>
              </ul>
            </div>

            {/* Feature 4: Client-Friendly */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 transition-all duration-400 group">
              <Smile className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Client-Friendly Dashboards</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Interactive dashboards designed for humans, not data scientists. Color-coded metrics, plain-English insights, mobile-optimized.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> 90%+ client engagement</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Mobile responsive</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Live data updates</li>
              </ul>
            </div>

            {/* Feature 5: Integrations - UPDATED */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 transition-all duration-400 group">
              <PuzzleIcon className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Growing Integration Library</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Google Analytics 4, Search Console, Google Ads, Facebook Ads, Ahrefs, SEMrush, and more. New platforms added monthly based on user requests.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Pre-built integrations</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> One-click OAuth setup</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> More integrations shipping monthly</li>
              </ul>
            </div>

            {/* Feature 6: ROI */}
            <div className="relative bg-gradient-to-br from-[#72a3bf]/20 to-[#446e87]/10 backdrop-blur-sm border border-[#72a3bf]/30 rounded-2xl p-8 hover:border-[#72a3bf] hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(114,163,191,0.4)] transition-all duration-400 group">
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                BEST VALUE
              </div>
              <TrendingUp className="w-12 h-12 text-[#72a3bf] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Insane ROI</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Average agency saves 40+ hours/month. That's $4,000-8,000 in recovered billable time at standard agency rates.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Average ROI: 2,847%</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Payback: 4.3 days</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#72a3bf]" /> Cost per report: $2.16</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS SHOWCASE SECTION - NEW */}
      <section id="integrations" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Works With Every Tool in Your<br />
              <span className="text-[#72a3bf]">SEO Arsenal</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pre-built integrations with the platforms you already use daily
            </p>
          </div>

          {/* Analytics & Search */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 text-gray-700">Analytics & Search</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Google Analytics 4', 'Google Search Console', 'Adobe Analytics', 'Matomo'].map((tool) => (
                <div key={tool} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-center hover:border-[#72a3bf] hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-marine to-harbor rounded-lg mx-auto mb-3"></div>
                  <p className="text-sm font-medium">{tool}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Tracking */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 text-gray-700">Keyword Tracking</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Ahrefs', available: true },
                { name: 'SEMrush', available: true },
                { name: 'Moz Pro', available: true },
                { name: 'Screaming Frog', available: true },
                { name: 'Majestic', available: true },
                { name: 'Advanced Rank Tracking', available: false }
              ].map((tool) => (
                <div key={tool.name} className={`bg-gray-50/80 backdrop-blur-sm border ${tool.available ? 'border-gray-200' : 'border-dashed border-gray-700'} rounded-xl p-6 text-center hover:border-[#72a3bf] hover:scale-105 transition-transform duration-300 ${!tool.available && 'opacity-50'}`}>
                  <div className={`w-12 h-12 ${tool.available ? 'bg-gradient-to-br from-marine to-harbor' : 'bg-gray-700'} rounded-lg mx-auto mb-3`}></div>
                  <p className="text-sm font-medium">{tool.name}</p>
                  {!tool.available && <span className="text-xs text-gray-500 mt-1 inline-block">Coming Soon</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Paid Advertising */}
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 text-gray-700">Paid Advertising</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Microsoft Advertising'].map((tool) => (
                <div key={tool} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-center hover:border-[#72a3bf] hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-glacier to-marine rounded-lg mx-auto mb-3"></div>
                  <p className="text-sm font-medium">{tool}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="text-center mt-12 p-8 bg-gray-50/40 rounded-2xl border border-dashed border-gray-700">
            <p className="text-gray-400 mb-4">
              Don't see your tool? <Link href="#contact" className="text-[#72a3bf] hover:underline">Request Integration →</Link>
            </p>
            <p className="text-sm text-gray-500">We add new integrations every month based on customer requests.</p>
          </div>
        </div>
      </section>

      {/* QUICK WINS SECTION - NEW */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            What You Can Do in Your<br />
            <span className="text-[#72a3bf]">First Week</span>
          </h2>

          <div className="mt-12 space-y-4">
            {[
              { day: 'Day 1', task: 'Sign up and connect your data sources', time: '15 minutes' },
              { day: 'Day 2', task: 'Generate your first report, see the magic', time: '3 minutes' },
              { day: 'Day 3', task: 'Customize with your branding', time: '10 minutes' },
              { day: 'Day 4', task: 'Send to test client, get feedback', time: '2 minutes' },
              { day: 'Day 5', task: 'Set up automated monthly delivery', time: '5 minutes' },
              { day: 'Day 6-7', task: 'Kick back and let AI handle next month\'s reports', time: '0 minutes' }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-6 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:border-[#72a3bf] transition-all">
                <CheckCircle className="w-6 h-6 text-[#72a3bf] flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-[#72a3bf]">{item.day}:</span> {item.task}
                </div>
                <span className="text-sm text-gray-500">({item.time})</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gradient-to-br from-[#72a3bf]/10 to-[#446e87]/5 rounded-2xl border border-[#72a3bf]/30 text-center">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <div className="text-3xl font-bold text-[#72a3bf] mb-2">35 minutes</div>
                <div className="text-gray-600">Total time invested</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#72a3bf] mb-2">40+ hours</div>
                <div className="text-gray-600">Time saved per month</div>
              </div>
            </div>

            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(114,163,191,0.3)] hover:shadow-[0_6px_30px_rgba(114,163,191,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                Get Started for $49/month
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From <span className="text-[#72a3bf]">Data Chaos</span> to Client Applause<br />
              in 3 Clicks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-[#72a3bf] via-[#72a3bf] to-[#72a3bf] opacity-30"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#72a3bf] to-[#446e87] rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold shadow-[0_4px_20px_rgba(114,163,191,0.4)] z-10">
                01
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 pt-12 mt-8 hover:border-[#72a3bf] transition-all">
                <h3 className="text-2xl font-bold mb-4">Connect Your Tools</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  One-click OAuth with Google Analytics, Search Console, and 50+ SEO tools. No API keys. No developer needed. Takes 90 seconds.
                </p>
                <div className="flex justify-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor"></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#72a3bf] to-[#446e87] rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold shadow-[0_4px_20px_rgba(114,163,191,0.4)] z-10">
                02
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 pt-12 mt-8 hover:border-[#72a3bf] transition-all">
                <h3 className="text-2xl font-bold mb-4">Customize Your Template</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Add your logo, choose your brand colors, select which metrics matter to THIS client. Save as template. Never do it again.
                </p>
                <div className="text-sm text-gray-500">Before → After: Generic vs Branded</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#72a3bf] to-[#446e87] rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold shadow-[0_4px_20px_rgba(114,163,191,0.4)] z-10">
                03
              </div>
              <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 pt-12 mt-8 hover:border-[#72a3bf] transition-all">
                <h3 className="text-2xl font-bold mb-4">Generate & Deliver</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Click "Generate Report." AI analyzes everything, creates insights, builds charts, writes summaries. Export as PDF, send live link, or auto-deliver monthly.
                </p>
                <div className="text-sm text-gray-500">✨ Magic happens here</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(114,163,191,0.3)] hover:shadow-[0_6px_30px_rgba(114,163,191,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                Get Started for $49/month
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS/RESULTS SECTION */}
      <section id="testimonials" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 leading-tight">
            Real Agencies. <span className="text-[#72a3bf]">Real Results.</span><br />
            Real Talk.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Testimonial 1 */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-marine to-harbor"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Marcus Chen</h4>
                  <p className="text-sm text-gray-500">Founder, Velocity SEO</p>
                  <p className="text-xs text-gray-600">42-person agency</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#72a3bf]">
                "We 3X'd our agency revenue in 6 months"
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Before Search Insights, I spent 50+ hours/month on reports. Now it's 3 hours. I reinvested that time into client strategy and closed 12 new retainers this quarter.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="text-[#72a3bf] font-bold">↑ 347%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Reporting Time</span>
                  <span className="text-[#72a3bf] font-bold">↓ 94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">New Clients</span>
                  <span className="text-[#72a3bf] font-bold">↑ 12</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-marine to-harbor"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">CEO, Digital Growth Co</p>
                  <p className="text-xs text-gray-600">28-person agency</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#72a3bf]">
                "Client retention went from 65% to 94%"
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our clients love the interactive dashboards. They actually understand their metrics now. We haven't lost a client in 8 months since switching.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Retention Rate</span>
                  <span className="text-[#72a3bf] font-bold">↑ 94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Client Satisfaction</span>
                  <span className="text-[#72a3bf] font-bold">↑ 89%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Referrals</span>
                  <span className="text-[#72a3bf] font-bold">↑ 156%</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:border-[#72a3bf] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600"></div>
                <div className="ml-4">
                  <h4 className="font-bold">James Rodriguez</h4>
                  <p className="text-sm text-gray-500">Founder, SEO Masters</p>
                  <p className="text-xs text-gray-600">Solo consultant → 8 people</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#72a3bf]">
                "Scaled from solo to 8-person team"
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                I was stuck doing reports instead of growing. Search Insights freed up my time to hire, train, and scale. Best investment I've ever made.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Team Size</span>
                  <span className="text-[#72a3bf] font-bold">1 → 8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Client Capacity</span>
                  <span className="text-[#72a3bf] font-bold">↑ 600%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">MRR</span>
                  <span className="text-[#72a3bf] font-bold">↑ 410%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <div className="text-6xl md:text-7xl font-bold text-[#72a3bf] mb-2 animate-pulse">2,847</div>
              <div className="text-gray-600">Active Agencies</div>
            </div>
            <div>
              <div className="text-6xl md:text-7xl font-bold text-[#72a3bf] mb-2 animate-pulse">40,500+</div>
              <div className="text-gray-600">Reports Generated</div>
            </div>
            <div>
              <div className="text-6xl md:text-7xl font-bold text-[#72a3bf] mb-2 animate-pulse">99.8%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Pricing That Makes Your<br />
            <span className="text-[#72a3bf]">Accountant Smile</span>
          </h2>

          <div className="bg-gray-50/80 backdrop-blur-sm border border-[#72a3bf]/30 rounded-2xl p-12 mb-8">
            <div className="text-9xl font-bold text-[#72a3bf] mb-4">$49<span className="text-3xl text-gray-600">/month</span></div>
            <p className="text-xl text-gray-400 mb-2">
              That's less than your Netflix + Spotify subscriptions.
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Less than 1 billable hour. Less than lunch for your team.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              At $49/month, this pays for itself if it saves you just one hour - and it'll save you 40+.
            </p>

            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(114,163,191,0.3)] hover:shadow-[0_6px_30px_rgba(114,163,191,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                See All Plans & Get Started
              </Link>
            </Button>

            <div className="mt-6">
              <Link href="#pricing" className="text-[#72a3bf] hover:underline">
                View detailed pricing breakdown →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION - UPDATED */}
      <section id="faq" className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Questions? <span className="text-[#72a3bf]">We've Got Answers.</span>
          </h2>

          <div className="space-y-4">
            {[
              { q: "Do I need to know code?", a: "Not at all! Search Insights is completely no-code. If you can click a mouse, you can create professional SEO reports." },
              { q: "Is there a minimum commitment?", a: "Nope. Month-to-month billing. Cancel anytime with one click. No contracts, no commitments, no hassle. At $49/month, the risk is basically zero." },
              { q: "How long does setup take?", a: "Most agencies are up and running in under 5 minutes. Connect your Google account, add your logo, and you're ready to generate reports." },
              { q: "Do you offer white-label?", a: "Yes! All plans include white-label features. Your clients will only see your branding, never ours." },
              { q: "What platforms do you currently support?", a: "We integrate with Google Analytics 4, Google Search Console, all major paid advertising platforms (Google Ads, Facebook Ads, LinkedIn Ads, Microsoft Advertising), and keyword tracking tools like Ahrefs, SEMrush, and Moz. We're constantly adding new integrations - social media analytics and advanced SEO tools coming soon." },
              { q: "Is my data secure?", a: "Absolutely. We use bank-level encryption, are GDPR compliant, and never share your data with third parties." },
              { q: "Can I cancel anytime?", a: "Yes, absolutely. No contracts, no commitments. Cancel with one click from your dashboard." },
              { q: "Can I customize the reports?", a: "Yes! Customize colors, fonts, metrics, sections, and more. Save templates for different client types." }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden hover:border-[#72a3bf] transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-semibold">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#72a3bf]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="#integrations" className="text-[#72a3bf] hover:underline text-lg">
              See full integration list →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-[#030f18] via-[#1d4052] to-[#030f18] relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#72a3bf]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#446e87]/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to <span className="text-[#72a3bf]">Reclaim Your Time</span><br />
            and Impress Your Clients?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join 2,847 agencies who've eliminated the SEO reporting headache
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#72a3bf] to-[#446e87] text-gray-900 font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(114,163,191,0.3)] hover:shadow-[0_6px_30px_rgba(114,163,191,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                Get Started Today - From $49/mo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Micro-copy */}
          <p className="text-sm text-gray-500 mb-8">
            Full access. Cancel anytime. Plans for every agency size.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#72a3bf]" />
              <span>Bank-Level Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-[#72a3bf]" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-[#72a3bf]" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white">Search</span>
                <span className="text-[#72a3bf]"> Insights</span>
              </h3>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Professional SEO reporting platform that helps agencies and professionals create stunning client reports with automated data collection.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#features" className="hover:text-[#72a3bf] transition-colors">Features</Link></li>
                <li><Link href="#integrations" className="hover:text-[#72a3bf] transition-colors">Integrations</Link></li>
                <li><Link href="#pricing" className="hover:text-[#72a3bf] transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-[#72a3bf] transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/legal/privacy" className="hover:text-[#72a3bf] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-[#72a3bf] transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-[#72a3bf] transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Search Insights Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
