import { BarChart3, Upload, FileCheck, CheckCircle } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: 'form' | 'login') => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">School Admission Portal</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate('form')}
              className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Apply Now
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Staff Login
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Welcome to School Admission</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A modern, streamlined admission portal system designed for schools to manage applications
            efficiently from submission to final approval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Student Submission</h3>
            <p className="text-gray-600">
              Students can easily fill and submit their admission applications with photo uploads and
              comprehensive details.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Clerk Management</h3>
            <p className="text-gray-600">
              Clerks can review applications, generate PDFs, and send verified applications to the
              Headmaster for approval.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Headmaster Approval</h3>
            <p className="text-gray-600">
              Headmaster can review, approve, or reject applications with remarks and finalize
              student admissions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-12 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Student Applies</h4>
              <p className="text-gray-600 text-sm">Student fills complete admission form with photo</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Clerk Reviews</h4>
              <p className="text-gray-600 text-sm">Clerk downloads PDF and sends to Headmaster</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h4 className="font-bold text-gray-900 mb-2">HM Approves</h4>
              <p className="text-gray-600 text-sm">Headmaster reviews and approves/rejects</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                4
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Admission Complete</h4>
              <p className="text-gray-600 text-sm">Student admitted and record created</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4">For Students</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Easy online application form</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Photo upload capability</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Instant submission confirmation</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Secure data handling</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
            <h4 className="text-xl font-bold text-gray-900 mb-4">For Staff</h4>
            <ul className="space-y-3">
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Centralized application management</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>PDF generation and printing</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Approval workflow system</span>
              </li>
              <li className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Role-based access control</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => onNavigate('form')}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition shadow-lg"
          >
            Start Admission Application Now
          </button>
        </div>
      </div>

      <footer className="bg-gray-900 text-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            School Admission Portal &copy; {new Date().getFullYear()}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
