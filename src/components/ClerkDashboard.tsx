import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Application } from '../types';
import { jsPDF } from 'jspdf';
import { Search, Download, Send, Eye, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';

interface ClerkDashboardProps {
  onLogout: () => void;
}

export function ClerkDashboard({ onLogout }: ClerkDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.student_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.guardian_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (app: Application) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('SCHOOL ADMISSION FORM', pageWidth / 2, 15, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Submitted on: ${new Date(app.created_at || '').toLocaleDateString()}`, pageWidth - 20, yPosition, {
      align: 'right',
    });

    yPosition = 35;

    const addSection = (title: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(title, 15, yPosition);
      yPosition += 8;
      doc.setTextColor(0, 0, 0);
    };

    const addField = (label: string, value: string) => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, 15, yPosition);
      doc.setFont('helvetica', 'normal');
      const textWidth = pageWidth - 70;
      const splitText = doc.splitTextToSize(value, textWidth);
      doc.text(splitText, 60, yPosition);
      yPosition += Math.max(7, splitText.length * 5);
    };

    addSection('STUDENT INFORMATION');
    addField('Full Name', app.student_full_name);
    addField('Date of Birth', app.date_of_birth);
    addField('Gender', app.gender);
    addField('Blood Group', app.blood_group);
    addField('Nationality', app.nationality);
    addField('Class Applying For', app.applying_class);
    addField('Academic Year', app.academic_year);

    addSection('PARENT/GUARDIAN INFORMATION');
    addField("Father's Name", app.father_name);
    addField("Mother's Name", app.mother_name || 'N/A');
    addField('Guardian Name', app.guardian_name || 'N/A');
    addField('Contact Number', app.guardian_contact);
    addField('Email Address', app.guardian_email);

    addSection('ADDRESS INFORMATION');
    addField('Current Address', app.current_address);
    addField('Permanent Address', app.permanent_address || 'Same as current');
    addField('City', app.city);
    addField('State', app.state);
    addField('PIN Code', app.pin_code);

    addSection('PREVIOUS SCHOOL INFORMATION');
    addField('School Name', app.previous_school_name || 'N/A');
    addField('Last Class', app.previous_class || 'N/A');
    addField('Year of Passing', app.previous_year_passing || 'N/A');

    addSection('APPROVAL SECTION');
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }
    doc.text('For Headmaster Use:', 15, yPosition);
    yPosition += 10;
    doc.text('Signature: ___________________', 15, yPosition);
    yPosition += 10;
    doc.text('Date: ___________________', 15, yPosition);
    yPosition += 10;
    doc.text('Seal/Stamp:', 15, yPosition);

    doc.save(`${app.student_full_name}_admission_form.pdf`);
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clerk Dashboard</h1>
            <p className="text-blue-100 mt-2">Manage student applications</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === 'submitted').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Sent to HM</p>
            <p className="text-3xl font-bold text-blue-600">
              {applications.filter((a) => a.status === 'sent_to_hm').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {applications.filter((a) => a.status === 'approved').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending Review</option>
              <option value="sent_to_hm">Sent to HM</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {app.student_full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.applying_class}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.guardian_email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'submitted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : app.status === 'sent_to_hm'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {app.status === 'submitted'
                            ? 'Pending'
                            : app.status === 'sent_to_hm'
                              ? 'With HM'
                              : app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(app)}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {app.status === 'submitted' && (
                          <button
                            onClick={() => updateStatus(app.id!, 'sent_to_hm')}
                            className="text-orange-600 hover:text-orange-800 flex items-center gap-1"
                            title="Send to HM"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-96 overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedApp.student_full_name}</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium text-gray-900">{selectedApp.date_of_birth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900">{selectedApp.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applying for Class</p>
                    <p className="font-medium text-gray-900">{selectedApp.applying_class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Academic Year</p>
                    <p className="font-medium text-gray-900">{selectedApp.academic_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Father's Name</p>
                    <p className="font-medium text-gray-900">{selectedApp.father_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium text-gray-900">{selectedApp.guardian_contact}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Current Address</p>
                  <p className="font-medium text-gray-900">{selectedApp.current_address}</p>
                </div>

                {selectedApp.photo_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Student Photo</p>
                    <img
                      src={selectedApp.photo_url}
                      alt="Student"
                      className="w-32 h-40 object-cover rounded-lg border-2 border-gray-300"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => generatePDF(selectedApp)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  {selectedApp.status === 'submitted' && (
                    <button
                      onClick={() => {
                        updateStatus(selectedApp.id!, 'sent_to_hm');
                        setSelectedApp(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send to HM
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
