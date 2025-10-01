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
              <strong>Last Updated:</strong> September 7, 2025
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