import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { getApplicationByReference } from '../lib/firebase';
import type { LoanApplication } from '../lib/firebase';

export default function Status() {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const result = await getApplicationByReference(referenceNumber.trim().toUpperCase());
      setApplication(result);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: unknown) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date as string);
    return d.toLocaleDateString('en-PG', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0] pt-[100px] pb-20">
      <div className="max-w-[600px] mx-auto px-6">
        {/* Lookup Form */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-8 lg:p-10 mb-6">
          <h1 className="font-display text-[28px] font-normal text-[#0F1419] mb-2">
            Check Your Application Status
          </h1>
          <p className="text-[16px] font-body text-[#6B7280] mb-6">
            Enter your application reference number to check the status.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., TLA-2025-0001"
                className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] uppercase ${
                  error ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                }`}
              />
              {error && <p className="text-[13px] font-body text-[#DC2626] mt-1">{error}</p>}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#008080] text-white text-[14px] font-medium font-body rounded-lg hover:bg-[#006666] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Check Status
            </button>
          </div>
        </div>

        {/* Status Display */}
        {searched && !loading && application && (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-8 lg:p-10 mb-6">
            {application.status === 'pending' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#D97706]/10 flex items-center justify-center">
                    <Clock size={40} className="text-[#D97706]" />
                  </div>
                </div>
                <h2 className="font-display text-[28px] font-medium text-[#D97706] mb-3">
                  Pending Approval
                </h2>
                <p className="text-[16px] font-body text-[#0F1419] mb-2">
                  Your application is being reviewed. This usually takes 1–2 hours.
                </p>
                <p className="text-[14px] font-body text-[#6B7280] mb-1">
                  Submitted: {formatDate(application.submittedAt)}
                </p>
              </div>
            )}

            {application.status === 'approved' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center">
                    <CheckCircle size={40} className="text-[#059669]" />
                  </div>
                </div>
                <h2 className="font-display text-[28px] font-medium text-[#059669] mb-3">
                  Approved!
                </h2>
                <p className="text-[16px] font-body text-[#0F1419] mb-4">
                  Congratulations! Your loan has been approved. Funds will be transferred within 24 hours.
                </p>
                <div className="bg-[#F5F5F0] rounded-lg p-4 text-left">
                  <div className="grid grid-cols-2 gap-3 text-[14px] font-body">
                    <div><span className="text-[#6B7280]">Amount:</span> K{application.loanAmount.toLocaleString()}</div>
                    <div><span className="text-[#6B7280]">Term:</span> {application.loanTerm} months</div>
                    <div><span className="text-[#6B7280]">Type:</span> {application.loanType.charAt(0).toUpperCase() + application.loanType.slice(1)}</div>
                  </div>
                </div>
              </div>
            )}

            {application.status === 'rejected' && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center">
                    <XCircle size={40} className="text-[#DC2626]" />
                  </div>
                </div>
                <h2 className="font-display text-[28px] font-medium text-[#DC2626] mb-3">
                  Not Approved
                </h2>
                <p className="text-[16px] font-body text-[#0F1419] mb-2">
                  We were unable to approve your application at this time. You may reapply after 30 days.
                </p>
                {application.rejectionReason && (
                  <p className="text-[14px] font-body text-[#6B7280]">
                    Reason: {application.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Not Found */}
        {searched && !loading && !application && (
          <div className="bg-white rounded-2xl border border-black/[0.08] p-8 lg:p-10 mb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#6B7280]/10 flex items-center justify-center">
                <Search size={40} className="text-[#6B7280]" />
              </div>
            </div>
            <h2 className="font-display text-[24px] font-normal text-[#0F1419] mb-2">
              Application Not Found
            </h2>
            <p className="text-[16px] font-body text-[#6B7280]">
              We couldn't find an application with reference number "{referenceNumber}". Please check the number and try again.
            </p>
          </div>
        )}

        {/* Support Section */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-6">
          <div className="border-t border-[#E5E5E5] pt-6 -mt-2">
            <h3 className="text-[16px] font-medium font-body text-[#0F1419] mb-2">Need Help?</h3>
            <p className="text-[14px] font-body text-[#6B7280] mb-3">
              For complaints or inquiries, contact our support team.
            </p>
            <div className="flex items-center gap-2 text-[14px] font-body">
              <Mail size={16} className="text-[#008080]" />
              <a href="mailto:trupelaloanorganisation@gmail.com" className="text-[#008080] hover:underline">
                trupelaloanorganisation@gmail.com
              </a>
            </div>
            <p className="text-[13px] font-body text-[#6B7280] mt-2">
              Mon–Fri, 8AM–5PM PNG time
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-[14px] font-body text-[#008080] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

