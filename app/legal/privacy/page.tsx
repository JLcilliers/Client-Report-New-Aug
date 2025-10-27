import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-marine hover:text-harbor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">Search Insights Hub</p>
            <p className="text-sm text-gray-500 mt-2">
              <strong>Last Updated:</strong> October 27, 2024
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-frost border-l-4 border-glacier p-4 mb-8">
              <p className="text-sm text-harbor">
                <strong>Important Notice:</strong> This is a template for informational purposes.
                Consult with a qualified attorney for legal advice specific to your situation.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Search Insights Hub ("we," "us," or "our") operates the Search Insights Hub platform 
                (the "Service"), a comprehensive SEO reporting platform that integrates with Google Analytics, 
                Search Console, and PageSpeed Insights to provide automated client reporting.
              </p>
              <p className="mb-4">
                This Privacy Policy describes how we collect, use, and protect your information when you 
                use our Service. By using our Service, you agree to the collection and use of information 
                in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Account registration information (name, email address, company details)</li>
                <li>Google OAuth credentials for accessing Google Analytics and Search Console</li>
                <li>Client website information and reporting configurations</li>
                <li>Payment and billing information (processed by third-party payment processors)</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Usage data and analytics about how you interact with our Service</li>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Log files and technical data for service maintenance and security</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Information from Third-Party Services</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Google Analytics data (website traffic, user behavior, conversion metrics)</li>
                <li>Google Search Console data (search performance, indexing status, technical issues)</li>
                <li>PageSpeed Insights data (website performance metrics)</li>
                <li>Authentication data from Google OAuth services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>To provide and maintain our SEO reporting services</li>
                <li>To authenticate users and manage user accounts</li>
                <li>To generate automated SEO reports and analytics</li>
                <li>To improve our Service functionality and user experience</li>
                <li>To communicate with you about your account and our services</li>
                <li>To provide customer support and respond to your inquiries</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our Terms of Service</li>
                <li>To send you marketing communications (with your consent where required)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3.5 Google User Data - Sharing, Transfer, and Disclosure</h2>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  Important Information About Your Google Data
                </p>
                <p className="text-sm text-blue-800">
                  Search Insights Hub's use and transfer of information received from Google APIs adheres to the{' '}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy"
                     className="underline hover:text-blue-900"
                     target="_blank"
                     rel="noopener noreferrer">
                    Google API Services User Data Policy
                  </a>, including the Limited Use requirements.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">What Google Data We Access</h3>
              <p className="mb-4">
                When you connect your Google account to Search Insights Hub, we request read-only access to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Google Analytics Data:</strong> Website traffic, user behavior, conversion metrics, and performance data from your Analytics properties</li>
                <li><strong>Google Search Console Data:</strong> Search performance, keyword rankings, indexing status, and technical SEO information</li>
                <li><strong>Basic Profile Information:</strong> Your email address and profile name for authentication purposes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">How We Use Your Google Data</h3>
              <p className="mb-4">
                We use your Google data exclusively for the following purposes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Generating automated SEO reports and analytics dashboards within your account</li>
                <li>Displaying your website performance metrics and search visibility data</li>
                <li>Creating client reports that you specifically request through our platform</li>
                <li>Providing you with insights and recommendations based on your SEO data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Sharing and Third-Party Access</h3>
              <p className="mb-4 font-semibold text-gray-900">
                We do NOT share, sell, rent, or disclose your Google user data to any third parties for their marketing purposes.
              </p>
              <p className="mb-4">
                Your Google data is kept strictly confidential and is only accessible to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>You:</strong> Through your authenticated account on our platform</li>
                <li><strong>Your authorized team members:</strong> If you explicitly grant them access within our platform</li>
                <li><strong>Our technical infrastructure:</strong> Only for the purpose of processing and displaying your data (see Data Transfer section below)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Transfer and Storage</h3>
              <p className="mb-4">
                Your Google user data is transferred and stored as follows:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Infrastructure Provider:</strong> Vercel (serverless deployment platform) and Supabase (PostgreSQL database)</li>
                <li><strong>Data Location:</strong> United States (AWS/Vercel infrastructure)</li>
                <li><strong>Transfer Method:</strong> All data transfers occur over encrypted HTTPS connections</li>
                <li><strong>Storage Duration:</strong> Your Google Analytics and Search Console data is cached temporarily to generate reports. We do not permanently store your raw Google data beyond what is necessary for report generation and display</li>
                <li><strong>Access Tokens:</strong> Your Google OAuth tokens are stored securely with encryption and are only used to access your data when you explicitly request it through our platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Disclosure</h3>
              <p className="mb-4">
                We will only disclose your Google user data in the following limited circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>With Your Explicit Consent:</strong> When you specifically authorize us to share your data</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Protection of Rights:</strong> To protect our legal rights, prevent fraud, or ensure platform security</li>
              </ul>
              <p className="mb-4">
                <strong>We will never sell your Google user data to third parties under any circumstances.</strong>
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Control Over Google Data</h3>
              <p className="mb-4">
                You maintain full control over your Google data:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Revoke Access:</strong> You can disconnect your Google account at any time through our platform settings or through your{' '}
                  <a href="https://myaccount.google.com/permissions"
                     className="text-marine hover:text-harbor underline"
                     target="_blank"
                     rel="noopener noreferrer">
                    Google Account Permissions
                  </a>
                </li>
                <li><strong>Data Deletion:</strong> When you disconnect your Google account, we will delete your cached Google data within 30 days</li>
                <li><strong>Limited Scope:</strong> We only request read-only access to your data - we cannot modify or delete anything in your Google Analytics or Search Console accounts</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Security Measures</h3>
              <p className="mb-4">
                We implement industry-standard security measures to protect your Google user data:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>OAuth 2.0 authentication with secure token storage</li>
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure database encryption at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Restricted access to Google data by our technical systems only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Data Protection Rights</h2>
              <p className="mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
                <li><strong>Restriction:</strong> Request restriction of processing under certain circumstances</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your data protection 
                rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Search Insights Hub</strong></p>
                <p className="mb-2">Email: privacy@searchinsightshub.com</p>
                <p className="mb-2">Address: [Your Business Address]</p>
                <p className="mb-2">Data Protection Officer: dpo@searchinsightshub.com</p>
              </div>
            </section>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This privacy policy template is provided for informational 
                purposes only and does not constitute legal advice. Please consult with a qualified 
                attorney to ensure compliance with applicable laws and regulations specific to your 
                business and jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}