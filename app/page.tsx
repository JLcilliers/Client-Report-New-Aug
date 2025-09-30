"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
  FileText,
  Search,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
  Eye,
  Target
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans">
      {/* Header/Navigation */}
      <header className="border-b border-dark-border bg-dark-bg/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">
                <span className="text-white">Search</span>
                <span className="text-neon-green"> Insights</span>
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="#benefits" className="text-gray-300 hover:text-white transition-colors">
                Benefits
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button
                asChild
                className="bg-neon-green text-dark-bg hover:bg-neon-green-dark font-semibold shadow-neon"
              >
                <Link href="/login">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-dark-bg to-dark-bg"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-dark-bg-card border border-dark-border rounded-full px-4 py-2 mb-8">
              <Zap className="h-4 w-4 text-neon-green" />
              <span className="text-sm text-gray-300">Professional SEO Reporting Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The <span className="text-white">AI SaaS</span> your<br />
              <span className="text-neon-green">SEO reports need</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Our AI SaaS solution enhances your reporting with advanced automation,
              streamlining operations and driving efficiency and innovation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                asChild
                className="bg-neon-green text-dark-bg hover:bg-neon-green-dark font-bold text-lg px-10 py-6 shadow-neon-lg"
              >
                <Link href="/login">
                  Get Template
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-gray-700 text-white hover:bg-gray-800 text-lg px-10 py-6"
              >
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-dark-bg"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-dark-bg"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-dark-bg"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-dark-bg"></div>
              </div>
              <span>Trusted by <strong className="text-white">500+</strong> SEO professionals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Access to the <span className="text-neon-green">future of reporting</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience AI-driven features, intelligent automation, seamless integrations, and real-time
              insights. Benefit from a user-friendly interface and top-notch security, boosting your team's productivity.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Card 1 - Large Featured */}
            <div className="lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/30 rounded-2xl p-8 hover:border-neon-green/50 transition-all">
              <div className="mb-4">
                <div className="inline-flex items-center space-x-2 text-sm text-neon-green mb-4">
                  <span className="font-semibold">SCALABILITY</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Build Scalable reports with the help of our AI
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Easily scale your resources up or down based on business needs without hardware limitations.
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-gray-600 transition-all">
              <BarChart3 className="h-12 w-12 text-neon-green mb-4" />
              <h3 className="text-xl font-bold mb-3">Google Analytics Integration</h3>
              <p className="text-gray-400 leading-relaxed">
                Seamlessly connect with Google Analytics to pull traffic data, user behavior metrics, and conversion tracking.
              </p>
            </div>

            {/* Feature Card 3 - Featured with Image/Chart placeholder */}
            <div className="lg:row-span-2 bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-gray-600 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Track performance metrics in real-time with live dashboards and instant updates.
                </p>
              </div>
              {/* Chart visualization placeholder */}
              <div className="bg-dark-bg rounded-xl p-4 h-48 flex items-end justify-around">
                <div className="w-8 bg-gradient-to-t from-neon-green to-neon-green/50 rounded-t" style={{height: '40%'}}></div>
                <div className="w-8 bg-gradient-to-t from-neon-green to-neon-green/50 rounded-t" style={{height: '70%'}}></div>
                <div className="w-8 bg-gradient-to-t from-neon-green to-neon-green/50 rounded-t" style={{height: '55%'}}></div>
                <div className="w-8 bg-gradient-to-t from-neon-green to-neon-green/50 rounded-t" style={{height: '85%'}}></div>
                <div className="w-8 bg-gradient-to-t from-neon-green to-neon-green/50 rounded-t" style={{height: '60%'}}></div>
              </div>
            </div>

            {/* Feature Card 4 - Cost Effectiveness */}
            <div className="bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-gray-600 transition-all">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-3">Cost-effectiveness</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Reduce upfront costs with a subscription-based model and avoid expenses associated with hardware maintenance.
                </p>
              </div>
              <div className="text-5xl font-bold text-neon-green">90%</div>
            </div>

            {/* Feature Card 5 - Success indicator */}
            <div className="bg-dark-bg-card border border-dark-border rounded-2xl p-6 hover:border-gray-600 transition-all flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neon-green/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-neon-green" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Setup Successful</h4>
                <p className="text-sm text-gray-400">Today, 09:24</p>
              </div>
            </div>

            {/* Feature Card 6 - User metrics */}
            <div className="bg-gradient-to-br from-neon-green/10 to-dark-bg-card border border-neon-green/30 rounded-2xl p-8 hover:border-neon-green/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">Analytics and Insights</h3>
                  <p className="text-gray-400 text-sm">
                    Gain valuable insights through built-in analytics tools, allowing for data-driven decision-making and optimization.
                  </p>
                </div>
              </div>
              <div className="flex -space-x-2 mt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-dark-bg"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-dark-bg"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-dark-bg"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-dark-bg"></div>
              </div>
              <p className="text-sm text-gray-400 mt-3">
                Our users span across the different continents of the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-dark-bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">How</span>{" "}
              <span className="text-neon-green">It Works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-neon-green/50 transition-all group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-neon-green text-dark-bg rounded-full flex items-center justify-center text-xl font-bold shadow-neon">
                01
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold mb-4">Connect Your Accounts</h3>
                <p className="text-gray-400 leading-relaxed">
                  Securely connect your Google Analytics, Search Console, and other data sources with our one-click integration system.
                </p>
              </div>
              <div className="mt-6">
                <div className="w-full h-1 bg-dark-border rounded-full overflow-hidden">
                  <div className="h-full bg-neon-green w-full"></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-neon-green/50 transition-all group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-neon-green text-dark-bg rounded-full flex items-center justify-center text-xl font-bold shadow-neon">
                02
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold mb-4">Add Your Clients</h3>
                <p className="text-gray-400 leading-relaxed">
                  Set up client profiles and link their websites to your connected data sources for automated data collection.
                </p>
              </div>
              <div className="mt-6">
                <div className="w-full h-1 bg-dark-border rounded-full overflow-hidden">
                  <div className="h-full bg-neon-green w-2/3"></div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-dark-bg-card border border-dark-border rounded-2xl p-8 hover:border-neon-green/50 transition-all group">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-neon-green text-dark-bg rounded-full flex items-center justify-center text-xl font-bold shadow-neon">
                03
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold mb-4">Generate Reports</h3>
                <p className="text-gray-400 leading-relaxed">
                  Create beautiful, professional reports in seconds. Customize branding, share with clients, and track engagement.
                </p>
              </div>
              <div className="mt-6">
                <div className="w-full h-1 bg-dark-border rounded-full overflow-hidden">
                  <div className="h-full bg-neon-green w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center space-x-2 bg-dark-bg-card border border-dark-border rounded-full px-4 py-2 mb-6">
                <span className="text-sm text-neon-green font-semibold">WHY CHOOSE US</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your <span className="text-neon-green">trusted</span> partner of<br />
                <span className="text-white">SEO reporting</span>
              </h2>

              <div className="space-y-6 mt-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Save Time & Increase Efficiency</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Reduce report creation time from hours to minutes with automated data collection and pre-built templates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Secure & Reliable</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Enterprise-grade security with Google OAuth authentication and secure data handling that keeps your client data safe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Real-Time Data</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Always stay up-to-date with the latest metrics and performance data from all your connected sources.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Featured Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-dark-bg-card border border-dark-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Monthly Reports</h4>
                  <Target className="h-5 w-5 text-neon-green" />
                </div>
                <div className="text-4xl font-bold mb-2">$4,528 <span className="text-sm font-normal text-gray-400">USD</span></div>
                <p className="text-sm text-gray-400">Average value generated per client</p>
              </div>

              <div className="bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/30 rounded-2xl p-6">
                <h4 className="font-semibold mb-2">Setup Time</h4>
                <div className="text-3xl font-bold text-neon-green">5min</div>
                <p className="text-xs text-gray-400 mt-2">Fast integration</p>
              </div>

              <div className="bg-dark-bg-card border border-dark-border rounded-2xl p-6">
                <h4 className="font-semibold mb-2">Accuracy</h4>
                <div className="text-3xl font-bold">99.9%</div>
                <p className="text-xs text-gray-400 mt-2">Data precision</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-dark-bg-secondary/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to <span className="text-neon-green">Transform</span><br />
            Your SEO Reporting?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join hundreds of SEO professionals who have streamlined their workflow and impressed their clients with professional, data-driven reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-neon-green text-dark-bg hover:bg-neon-green-dark font-bold text-lg px-10 py-6 shadow-neon-lg"
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
              className="border-2 border-gray-700 text-white hover:bg-gray-800 text-lg px-10 py-6"
            >
              <Link href="#features">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">
                <span className="text-white">Search</span>
                <span className="text-neon-green"> Insights</span>
              </h3>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Professional SEO reporting platform that helps agencies and professionals create stunning client reports with automated data collection.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-neon-green transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-neon-green transition-colors">How It Works</Link></li>
                <li><Link href="/login" className="hover:text-neon-green transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal/privacy" className="hover:text-neon-green transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-neon-green transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-neon-green transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-border mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Search Insights Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
