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
  PlayCircle,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone
} from "lucide-react"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[70px]">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold">
                <span className="text-white">Search</span>
                <span className="text-[#D4FF00]"> Insights</span>
              </h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-8 text-[15px] font-medium">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">
                Resources
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                asChild
                className="text-white hover:bg-white/10 hidden md:inline-flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] text-black font-semibold hover:shadow-[0_4px_20px_rgba(212,255,0,0.4)] hover:-translate-y-0.5 transition-all duration-300 rounded-lg px-6"
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A]"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#D4FF00]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#00FF88]/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Stop Spending 40+ Hours on<br />
              <span className="text-white">Client SEO Reports</span>
            </h1>

            {/* Subheadline */}
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-[#D4FF00] leading-tight tracking-tight">
              AI-Powered Reports in 3 Minutes.<br />
              White-Label. Agency-Ready.
            </h2>

            {/* Supporting Copy */}
            <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Transform weeks of manual reporting into minutes. Our AI analyzes Google Analytics, Search Console,
              and 50+ data sources to create stunning, branded SEO reports your clients will actually read.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] text-black font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(212,255,0,0.3)] hover:shadow-[0_6px_30px_rgba(212,255,0,0.5)] hover:-translate-y-1 transition-all duration-300"
              >
                <Link href="/login">
                  Start Free 14-Day Trial
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-white text-white hover:bg-white hover:text-black text-lg px-10 h-14 rounded-lg transition-all duration-300"
              >
                <Link href="#demo">
                  See Live Demo
                </Link>
              </Button>
            </div>

            {/* Micro-copy */}
            <p className="text-sm text-gray-500 mb-12">
              No credit card required • Cancel anytime • Setup in 60 seconds
            </p>

            {/* Trust Signals */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-[#0A0A0A]"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-[#0A0A0A]"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-[#0A0A0A]"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-[#0A0A0A]"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-[#0A0A0A]"></div>
                </div>
                <span className="text-gray-400">Trusted by <strong className="text-white">2,847+</strong> SEO professionals</span>
              </div>
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#D4FF00] text-[#D4FF00]" />
                ))}
                <span className="text-gray-400 ml-2">4.9/5 from 890+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="bg-[#151515] py-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm mb-4">AS SEEN IN</p>
          <div className="flex justify-center items-center space-x-12 opacity-30">
            <span className="text-2xl font-bold">TechCrunch</span>
            <span className="text-2xl font-bold">Forbes</span>
            <span className="text-2xl font-bold">Search Engine Journal</span>
            <span className="text-2xl font-bold">Moz</span>
          </div>
        </div>
      </section>

      {/* PROBLEM/AGITATION SECTION */}
      <section id="problem" className="py-20 lg:py-32 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 leading-tight">
            The SEO Reporting Nightmare<br />
            <span className="text-[#D4FF00]">Every Agency Knows Too Well</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pain Point 1 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-8 hover:border-red-400 transition-all">
              <Clock className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4">40+ Hours Per Month</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Manually pulling data from 6+ platforms, copy-pasting into spreadsheets, fixing broken formulas at 11 PM.
              </p>
            </div>

            {/* Pain Point 2 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-8 hover:border-red-400 transition-all">
              <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Clients Don't Get It</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Generic spreadsheets that look like tax returns. Clients glaze over and question your value every month.
              </p>
            </div>

            {/* Pain Point 3 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border-l-4 border-red-500 rounded-2xl p-8 hover:border-red-400 transition-all">
              <DollarSign className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Missed Opportunities</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                While you're formatting cells, competitors are closing deals. Your expertise is buried in busywork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION/TRANSFORMATION SECTION */}
      <section id="features" className="py-20 lg:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Meet Your <span className="text-[#D4FF00]">AI Reporting Assistant</span><br />
              That Works While You Sleep
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              One-click reports that make you look like the SEO genius you are
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI-Powered */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <Brain className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">AI-Powered Data Analysis</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Our AI analyzes patterns across GA4, GSC, Ahrefs, SEMrush, and 40+ sources. Automatically highlights wins, flags issues, and suggests actions.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> 50+ data sources connected</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Smart anomaly detection</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Predictive trend analysis</li>
              </ul>
            </div>

            {/* Feature 2: White-Label */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <Paintbrush className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">White-Label Perfection</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Upload your logo once. Every report automatically matches your brand colors, fonts, and style. Your clients never see our name.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Custom domain URLs</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Branded PDF exports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Client portal with your logo</li>
              </ul>
            </div>

            {/* Feature 3: Fast Generation */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <Zap className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">3-Minute Report Generation</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Click "Generate." Get coffee. Come back to a 40-page professional report with insights, charts, and action items.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Average: 3 min 14 sec</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Unlimited reports</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Automatic scheduling</li>
              </ul>
            </div>

            {/* Feature 4: Client-Friendly */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <Smile className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Client-Friendly Dashboards</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Interactive dashboards designed for humans, not data scientists. Color-coded metrics, plain-English insights, mobile-optimized.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> 90%+ client engagement</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Mobile responsive</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Live data updates</li>
              </ul>
            </div>

            {/* Feature 5: Integrations */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <PuzzleIcon className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Enterprise-Grade Integrations</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Google Analytics 4, Search Console, Ahrefs, SEMrush, Moz, Facebook Ads, Google Ads, and 40+ more with one-click OAuth.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Pre-built integrations</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> API access available</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Custom data sources</li>
              </ul>
            </div>

            {/* Feature 6: ROI */}
            <div className="bg-gradient-to-br from-[#D4FF00]/20 to-[#00FF88]/10 backdrop-blur-sm border border-[#D4FF00]/30 rounded-2xl p-8 hover:border-[#D4FF00] hover:-translate-y-2 transition-all duration-400 group">
              <TrendingUp className="w-12 h-12 text-[#D4FF00] mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-4">Insane ROI</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Average agency saves 40+ hours/month. That's $4,000-8,000 in recovered billable time at standard agency rates.
              </p>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Average ROI: 2,847%</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Payback: 4.3 days</li>
                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-[#D4FF00]" /> Cost per report: $2.16</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              From <span className="text-[#D4FF00]">Data Chaos</span> to Client Applause<br />
              in 3 Clicks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4FF00] via-[#D4FF00] to-[#D4FF00] opacity-30"></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#D4FF00] to-[#A8CC00] rounded-full flex items-center justify-center text-black text-2xl font-bold shadow-[0_4px_20px_rgba(212,255,0,0.4)] z-10">
                01
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 mt-8 hover:border-[#D4FF00] transition-all">
                <h3 className="text-2xl font-bold mb-4">Connect Your Tools</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  One-click OAuth with Google Analytics, Search Console, and 50+ SEO tools. No API keys. No developer needed. Takes 90 seconds.
                </p>
                <div className="flex justify-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600"></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#D4FF00] to-[#A8CC00] rounded-full flex items-center justify-center text-black text-2xl font-bold shadow-[0_4px_20px_rgba(212,255,0,0.4)] z-10">
                02
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 mt-8 hover:border-[#D4FF00] transition-all">
                <h3 className="text-2xl font-bold mb-4">Customize Your Template</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Add your logo, choose your brand colors, select which metrics matter to THIS client. Save as template. Never do it again.
                </p>
                <div className="text-sm text-gray-500">Before → After: Generic vs Branded</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#D4FF00] to-[#A8CC00] rounded-full flex items-center justify-center text-black text-2xl font-bold shadow-[0_4px_20px_rgba(212,255,0,0.4)] z-10">
                03
              </div>
              <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 mt-8 hover:border-[#D4FF00] transition-all">
                <h3 className="text-2xl font-bold mb-4">Generate & Deliver</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
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
              className="bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] text-black font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(212,255,0,0.3)] hover:shadow-[0_6px_30px_rgba(212,255,0,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                Try It Free - See It Work in 60 Seconds
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS/RESULTS SECTION */}
      <section id="testimonials" className="py-20 lg:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 leading-tight">
            Real Agencies. <span className="text-[#D4FF00]">Real Results.</span><br />
            Real Talk.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Testimonial 1 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Marcus Chen</h4>
                  <p className="text-sm text-gray-500">Founder, Velocity SEO</p>
                  <p className="text-xs text-gray-600">42-person agency</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#D4FF00]">
                "We 3X'd our agency revenue in 6 months"
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Before Search Insights, I spent 50+ hours/month on reports. Now it's 3 hours. I reinvested that time into client strategy and closed 12 new retainers this quarter.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="text-[#D4FF00] font-bold">↑ 347%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Reporting Time</span>
                  <span className="text-[#D4FF00] font-bold">↓ 94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">New Clients</span>
                  <span className="text-[#D4FF00] font-bold">↑ 12</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">CEO, Digital Growth Co</p>
                  <p className="text-xs text-gray-600">28-person agency</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#D4FF00]">
                "Client retention went from 65% to 94%"
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Our clients love the interactive dashboards. They actually understand their metrics now. We haven't lost a client in 8 months since switching.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Retention Rate</span>
                  <span className="text-[#D4FF00] font-bold">↑ 94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Client Satisfaction</span>
                  <span className="text-[#D4FF00] font-bold">↑ 89%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Referrals</span>
                  <span className="text-[#D4FF00] font-bold">↑ 156%</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-[#D4FF00] transition-all">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600"></div>
                <div className="ml-4">
                  <h4 className="font-bold">James Rodriguez</h4>
                  <p className="text-sm text-gray-500">Founder, SEO Masters</p>
                  <p className="text-xs text-gray-600">Solo consultant → 8 people</p>
                </div>
              </div>
              <p className="text-xl font-bold mb-4 text-[#D4FF00]">
                "Scaled from solo to 8-person team"
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                I was stuck doing reports instead of growing. Search Insights freed up my time to hire, train, and scale. Best investment I've ever made.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Team Size</span>
                  <span className="text-[#D4FF00] font-bold">1 → 8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Client Capacity</span>
                  <span className="text-[#D4FF00] font-bold">↑ 600%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">MRR</span>
                  <span className="text-[#D4FF00] font-bold">↑ 410%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <div className="text-5xl font-bold text-[#D4FF00] mb-2">2,847</div>
              <div className="text-gray-400">Active Agencies</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#D4FF00] mb-2">40,500+</div>
              <div className="text-gray-400">Reports Generated</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#D4FF00] mb-2">99.8%</div>
              <div className="text-gray-400">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="py-20 lg:py-32 bg-[#0D0D0D]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Pricing That Makes Your<br />
            <span className="text-[#D4FF00]">Accountant Smile</span>
          </h2>

          <div className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-[#D4FF00]/30 rounded-2xl p-12 mb-8">
            <div className="text-7xl font-bold text-[#D4FF00] mb-4">$49<span className="text-3xl text-gray-400">/month</span></div>
            <p className="text-xl text-gray-400 mb-8">
              That's less than your Netflix + Spotify subscriptions.<br />
              Less than 1 billable hour. Less than lunch for your team.
            </p>

            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] text-black font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(212,255,0,0.3)] hover:shadow-[0_6px_30px_rgba(212,255,0,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                See All Plans & Start Free Trial
              </Link>
            </Button>

            <div className="mt-6">
              <Link href="#pricing" className="text-[#D4FF00] hover:underline">
                View detailed pricing breakdown →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-32 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Questions? <span className="text-[#D4FF00]">We've Got Answers.</span>
          </h2>

          <div className="space-y-4">
            {[
              { q: "Do I need to know code?", a: "Not at all! Search Insights is completely no-code. If you can click a mouse, you can create professional SEO reports." },
              { q: "Can I cancel anytime?", a: "Yes, absolutely. No contracts, no commitments. Cancel with one click from your dashboard." },
              { q: "How long does setup take?", a: "Most agencies are up and running in under 5 minutes. Connect your Google account, add your logo, and you're ready to generate reports." },
              { q: "Do you offer white-label?", a: "Yes! All plans include white-label features. Your clients will only see your branding, never ours." },
              { q: "What integrations do you support?", a: "We support 50+ integrations including Google Analytics 4, Search Console, Ahrefs, SEMrush, Moz, Google Ads, Facebook Ads, and many more." },
              { q: "Is my data secure?", a: "Absolutely. We use bank-level encryption, are GDPR compliant, and never share your data with third parties." },
              { q: "Do you offer a free trial?", a: "Yes! Get full access for 14 days, no credit card required. Try every feature risk-free." },
              { q: "Can I customize the reports?", a: "Yes! Customize colors, fonts, metrics, sections, and more. Save templates for different client types." }
            ].map((faq, index) => (
              <div key={index} className="bg-[#1A1A1A]/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-[#D4FF00] transition-all">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-semibold">{faq.q}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-[#D4FF00]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4FF00]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00FF88]/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to <span className="text-[#D4FF00]">Reclaim Your Time</span><br />
            and Impress Your Clients?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join 2,847 agencies who've eliminated the SEO reporting headache
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#D4FF00] to-[#A8CC00] text-black font-bold text-lg px-10 h-14 rounded-lg shadow-[0_4px_20px_rgba(212,255,0,0.3)] hover:shadow-[0_6px_30px_rgba(212,255,0,0.5)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/login">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-2 border-gray-700 text-white hover:bg-gray-800 text-lg px-10 h-14 rounded-lg transition-all"
            >
              <Link href="#demo">
                Questions? Book a 15-min demo →
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400 pt-8 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#D4FF00]" />
              <span>Bank-Level Security</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-[#D4FF00]" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-[#D4FF00]" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white">Search</span>
                <span className="text-[#D4FF00]"> Insights</span>
              </h3>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Professional SEO reporting platform that helps agencies and professionals create stunning client reports with automated data collection.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-[#D4FF00] transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-[#D4FF00] transition-colors">How It Works</Link></li>
                <li><Link href="#pricing" className="hover:text-[#D4FF00] transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-[#D4FF00] transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal/privacy" className="hover:text-[#D4FF00] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-[#D4FF00] transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-[#D4FF00] transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Search Insights Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
