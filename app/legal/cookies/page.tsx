import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicy() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies</h2>
              <p className="mb-4">
                Cookies are small text files that are stored on your computer or mobile device when you 
                visit a website. They are widely used to make websites work more efficiently and provide 
                information to the owners of the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">
                Search Insights Hub uses cookies to enhance your experience on our platform and to provide 
                our services effectively. We use the following types of cookies:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the website to function and cannot be switched off in our systems. 
                They are usually only set in response to actions made by you which amount to a request for services.
              </p>
              
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 text-left">Cookie Name</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Purpose</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">session_token</td>
                      <td className="border border-gray-200 px-4 py-2">User authentication and session management</td>
                      <td className="border border-gray-200 px-4 py-2">30-90 days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">google_access_token</td>
                      <td className="border border-gray-200 px-4 py-2">Google API authentication</td>
                      <td className="border border-gray-200 px-4 py-2">1 hour</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2">google_refresh_token</td>
                      <td className="border border-gray-200 px-4 py-2">Google API token refresh</td>
                      <td className="border border-gray-200 px-4 py-2">6 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Performance Cookies</h3>
              <p className="mb-4">
                These cookies allow us to count visits and traffic sources so we can measure and improve 
                the performance of our site.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Functional Cookies</h3>
              <p className="mb-4">
                These cookies enable the website to provide enhanced functionality and personalization, 
                such as remembering your preferences and settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              <p className="mb-4">
                Our website may also use third-party cookies from the following services:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
                <li><strong>Google OAuth:</strong> For user authentication and authorization</li>
                <li><strong>Vercel:</strong> For hosting and performance optimization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Cookies</h2>
              <p className="mb-4">
                You can control and manage cookies in several ways:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Browser Settings</h3>
              <p className="mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Delete existing cookies</li>
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Set preferences for specific websites</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Chrome:</strong> Settings {'>'}  Privacy and Security {'>'} Cookies and other site data</li>
                <li><strong>Firefox:</strong> Options {'>'} Privacy & Security {'>'} Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Manage Website Data</li>
                <li><strong>Edge:</strong> Settings {'>'} Cookies and site permissions {'>'} Cookies and site data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Impact of Disabling Cookies</h2>
              <p className="mb-4">
                Please note that if you disable cookies, some features of our website may not function properly:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>You may not be able to log in to your account</li>
                <li>Your preferences and settings may not be saved</li>
                <li>Some interactive features may not work correctly</li>
                <li>We may not be able to provide personalized content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Updates to This Cookie Policy</h2>
              <p className="mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for other operational, legal, or regulatory reasons. We will notify you of any 
                significant changes by updating the "Last Updated" date at the top of this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2"><strong>Search Insights Hub</strong></p>
                <p className="mb-2">Email: privacy@searchinsightshub.com</p>
                <p className="mb-2">Address: [Your Business Address]</p>
              </div>
            </section>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This cookie policy template is provided for informational 
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