import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Application } from '../types';
import { CheckCircle, XCircle, Eye, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';

interface HeadmasterDashboardProps {
  onLogout: () => void;
}

interface Approval {
  id?: string;
  application_id: string;
  decision: 'approved' | 'rejected';
  remarks?: string;
}

export function HeadmasterDashboard({ onLogout }: HeadmasterDashboardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = applications;

    if (statusFilter === 'pending') {
      filtered = filtered.filter((app) => app.status === 'sent_to_hm');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter((app) => app.status === 'approved');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((app) => app.status === 'rejected');
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
        .in('status', ['sent_to_hm', 'approved', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (appId: string, decision: 'approved' | 'rejected') => {
    try {
      setApprovingId(appId);

      const { error: insertError } = await supabase.from('application_approvals').insert({
        application_id: appId,
        decision,
        remarks: approvalRemarks,
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: decision })
        .eq('id', appId);

      if (updateError) throw updateError;

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: decision } : app))
      );

      setSelectedApp(null);
      setApprovalRemarks('');
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setApprovingId(null);
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
            <h1 className="text-3xl font-bold">Headmaster Dashboard</h1>
            <p className="text-blue-100 mt-2">Review and approve student admissions</p>
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
            <p className="text-gray-600 text-sm">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === 'sent_to_hm').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {applications.filter((a) => a.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600">
              {applications.filter((a) => a.status === 'rejected').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{applications.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending Review</option>
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
                      Father's Name
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
                      <td className="px-6 py-4 text-sm text-gray-600">{app.father_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'sent_to_hm'
                              ? 'bg-yellow-100 text-yellow-800'
                              : app.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {app.status === 'sent_to_hm' ? 'Pending' : app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
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
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-96 overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedApp.student_full_name}</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
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

                {selectedApp.status === 'sent_to_hm' && (
                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      placeholder="Add any remarks or conditions for admission..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleApproval(selectedApp.id!, 'approved')}
                        disabled={approvingId === selectedApp.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {approvingId === selectedApp.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApproval(selectedApp.id!, 'rejected')}
                        disabled={approvingId === selectedApp.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <XCircle className="w-5 h-5" />
                        {approvingId === selectedApp.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedApp.status !== 'sent_to_hm' && (
                  <div className="border-t pt-6 text-center">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                        selectedApp.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedApp.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-medium capitalize">{selectedApp.status}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
