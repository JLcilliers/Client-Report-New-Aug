import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you 
                ("User," "you," or "your") and Search Insights Hub ("Company," "we," "us," or "our") 
                regarding your use of the Search Insights Hub platform and related services (the "Service").
              </p>
              <p className="mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                with any part of these Terms, then you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Search Insights Hub is a comprehensive SEO reporting platform that provides:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Integration with Google Analytics, Search Console, and PageSpeed Insights APIs</li>
                <li>Automated SEO reporting and analytics for client websites</li>
                <li>Data visualization and performance tracking tools</li>
                <li>Client management and report sharing capabilities</li>
                <li>SEO analysis tools and recommendations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="mb-4">
                To use our Service, you must create an account and provide accurate, current, and complete information. 
                You are responsible for maintaining the confidentiality of your account and password.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must be at least 18 years old to use the Service</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws or regulations in your jurisdiction</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Upload or transmit viruses, malware, or other harmful code</li>
                <li>Engage in any form of spam or unsolicited communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Google API Integration</h2>
              <p className="mb-4">
                Our Service integrates with Google APIs to provide SEO reporting functionality. By using our Service:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You must comply with Google's Terms of Service and API usage policies</li>
                <li>You grant us permission to access your Google Analytics and Search Console data</li>
                <li>You are responsible for ensuring you have proper authorization to access client data</li>
                <li>We will only use your Google data to provide the Service as described</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>
              <p className="mb-4">
                If you choose to purchase a paid subscription, you agree to the following payment terms:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Subscription fees are charged in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>You authorize us to charge your payment method for all applicable fees</li>
                <li>You are responsible for providing accurate payment information</li>
                <li>We may suspend your account for non-payment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="mb-4">
                The Service and all content, features, and functionality are owned by Search Insights Hub 
                and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mb-4">
                You retain ownership of any data you provide to the Service. By using the Service, 
                you grant us a limited license to use your data solely for the purpose of providing the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our{" "}
                <Link href="/legal/privacy" className="text-marine hover:text-harbor">
                  Privacy Policy
                </Link>
                , which explains how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers and Limitation of Liability</h2>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT 
                PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.
              </p>
              <p className="mb-4">
                IN NO EVENT SHALL SEARCH INSIGHTS HUB BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="mb-4">
                You may terminate your account at any time by contacting us. We may terminate or suspend 
                your account immediately, without prior notice, for conduct that we believe violates these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Search Insights Hub</strong></p>
                <p className="mb-2">Email: legal@searchinsightshub.com</p>
                <p className="mb-2">Address: [Your Business Address]</p>
              </div>
            </section>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This terms of service template is provided for informational 
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