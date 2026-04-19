import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Eye, Check, X, Loader2, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Filter, FileText, User, MapPin,
  DollarSign, Shield
} from 'lucide-react';
import {
  getAllApplications,
  updateApplicationStatus,
  adminLogout,
  getApplicationStats,
  auth,
} from '../lib/firebase';
import type { LoanApplication } from '../lib/firebase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate('/admin/login');
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      const [apps, statsData] = await Promise.all([
        getAllApplications(filter === 'all' ? undefined : filter),
        getApplicationStats(),
      ]);
      setApplications(apps);
      setStats(statsData);
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filter, loadData]);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const handleStatusUpdate = async (appId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await updateApplicationStatus(appId, status);
      await loadData();
      if (selectedApp) {
        setSelectedApp({ ...selectedApp, status });
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.referenceNumber?.toLowerCase().includes(q) ||
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.phone?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredApps.length / perPage);
  const paginatedApps = filteredApps.slice((page - 1) * perPage, page * perPage);

  const formatDate = (date: unknown) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date as string);
    return d.toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D97706]/10 text-[#D97706] text-[13px] font-medium font-body rounded-md">
            <Clock size={14} /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#059669]/10 text-[#059669] text-[13px] font-medium font-body rounded-md">
            <CheckCircle size={14} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DC2626]/10 text-[#DC2626] text-[13px] font-medium font-body rounded-md">
            <XCircle size={14} /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Loader2 size={40} className="text-[#008080] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.08] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-[#008080]" />
            <h1 className="font-display text-[24px] font-medium text-[#0F1419]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[14px] font-body text-[#6B7280] hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#008080] text-[#008080] text-[14px] font-medium font-body rounded-lg hover:bg-[#008080] hover:text-white active:scale-[0.98] transition-all"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total, color: '#008080', icon: <FileText size={20} /> },
            { label: 'Pending', value: stats.pending, color: '#D97706', icon: <Clock size={20} /> },
            { label: 'Approved', value: stats.approved, color: '#059669', icon: <CheckCircle size={20} /> },
            { label: 'Rejected', value: stats.rejected, color: '#DC2626', icon: <XCircle size={20} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-black/[0.08] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-body text-[#6B7280]">{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <p className="font-display text-[32px] font-medium text-[#0F1419]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-2 rounded-full text-[14px] font-medium font-body transition-all duration-200 ${
                  filter === f
                    ? 'bg-[#008080] text-white'
                    : 'bg-white text-[#0F1419] border border-black/[0.08] hover:border-[#008080]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-auto">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search by name or reference..."
              className="w-full sm:w-[280px] pl-10 pr-4 py-2.5 bg-white border border-black/[0.08] rounded-lg text-[14px] font-body outline-none transition-all duration-200 focus:border-[#008080]"
            />
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white border border-black/[0.08] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="text-[#008080] animate-spin" />
            </div>
          ) : paginatedApps.length === 0 ? (
            <div className="text-center py-20">
              <Filter size={48} className="text-[#E5E5E5] mx-auto mb-4" />
              <p className="text-[16px] font-body text-[#6B7280]">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.08]">
                    {['Reference', 'Name', 'Amount', 'Type', 'Location', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[13px] font-medium font-body text-[#6B7280] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedApps.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-black/[0.04] hover:bg-[rgba(0,128,128,0.03)] transition-colors"
                    >
                      <td className="px-4 py-3 text-[14px] font-body text-[#0F1419] font-medium whitespace-nowrap">
                        {app.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-body text-[#0F1419] whitespace-nowrap">
                        {app.fullName}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-body text-[#0F1419] whitespace-nowrap">
                        K{app.loanAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-body text-[#6B7280] whitespace-nowrap capitalize">
                        {app.loanType}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-body text-[#6B7280] whitespace-nowrap max-w-[150px] truncate">
                        {app.location}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{statusBadge(app.status)}</td>
                      <td className="px-4 py-3 text-[13px] font-body text-[#6B7280] whitespace-nowrap">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setSelectedApp(app); setShowModal(true); }}
                            className="p-2 text-[#008080] hover:bg-[#008080]/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(app.id!, 'approved')}
                                disabled={actionLoading}
                                className="p-2 text-[#059669] hover:bg-[#059669]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(app.id!, 'rejected')}
                                disabled={actionLoading}
                                className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-black/[0.08]">
              <p className="text-[13px] font-body text-[#6B7280]">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredApps.length)} of {filteredApps.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-black/[0.08] rounded-lg hover:border-[#008080] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-medium font-body transition-all ${
                      page === p
                        ? 'bg-[#008080] text-white'
                        : 'text-[#0F1419] hover:bg-[#F5F5F0]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-black/[0.08] rounded-lg hover:border-[#008080] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* View Modal */}
      {showModal && selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-[700px] max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-black/[0.08] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-display text-[24px] font-medium text-[#0F1419]">
                  {selectedApp.referenceNumber}
                </h2>
                <p className="text-[14px] font-body text-[#6B7280]">
                  Submitted: {formatDate(selectedApp.submittedAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(selectedApp.status)}
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[#F5F5F0] rounded-lg transition-colors"
                >
                  <X size={20} className="text-[#6B7280]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="text-[16px] font-medium font-body text-[#0F1419] mb-4 flex items-center gap-2">
                  <User size={18} className="text-[#008080]" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5F5F0] rounded-xl p-4">
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Name:</span> {selectedApp.fullName}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Email:</span> {selectedApp.email}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Phone:</span> {selectedApp.phone}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">DOB:</span> {selectedApp.dateOfBirth}</div>
                  {selectedApp.nationalId && (
                    <div className="text-[14px] font-body"><span className="text-[#6B7280]">National ID:</span> {selectedApp.nationalId}</div>
                  )}
                </div>
              </div>

              {/* Loan Details */}
              <div>
                <h3 className="text-[16px] font-medium font-body text-[#0F1419] mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-[#008080]" /> Loan Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5F5F0] rounded-xl p-4">
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Amount:</span> K{selectedApp.loanAmount.toLocaleString()}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Type:</span> {selectedApp.loanType.charAt(0).toUpperCase() + selectedApp.loanType.slice(1)}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Term:</span> {selectedApp.loanTerm} months</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Income:</span> K{selectedApp.monthlyIncome.toLocaleString()}/month</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Employment:</span> {selectedApp.employmentStatus}</div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-[16px] font-medium font-body text-[#0F1419] mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-[#008080]" /> Location
                </h3>
                <div className="bg-[#F5F5F0] rounded-xl p-4">
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Location:</span> {selectedApp.location}</div>
                  <div className="text-[14px] font-body"><span className="text-[#6B7280]">Address:</span> {selectedApp.address}</div>
                </div>
              </div>

              {/* KYC Documents */}
              {(selectedApp.idDocumentUrl || selectedApp.selfieUrl) && (
                <div>
                  <h3 className="text-[16px] font-medium font-body text-[#0F1419] mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-[#008080]" /> KYC Documents
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {selectedApp.idDocumentUrl && (
                      <div>
                        <p className="text-[13px] font-body text-[#6B7280] mb-2">ID Document</p>
                        <img
                          src={selectedApp.idDocumentUrl}
                          alt="ID Document"
                          className="w-[200px] h-[130px] object-cover rounded-lg border border-black/[0.08]"
                        />
                      </div>
                    )}
                    {selectedApp.selfieUrl && (
                      <div>
                        <p className="text-[13px] font-body text-[#6B7280] mb-2">Selfie</p>
                        <img
                          src={selectedApp.selfieUrl}
                          alt="Selfie"
                          className="w-[130px] h-[130px] object-cover rounded-lg border border-black/[0.08]"
                        />
                
