import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, UploadCloud, FileText, ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { submitApplication, uploadFile } from '../lib/firebase';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  loanAmount: string;
  loanType: 'personal' | 'business' | 'emergency';
  loanTerm: string;
  employmentStatus: string;
  monthlyIncome: string;
  location: string;
  address: string;
  idDocument: File | null;
  selfie: File | null;
  termsAgreed: boolean;
}

const INITIAL_DATA: FormData = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationalId: '',
  loanAmount: '',
  loanType: 'personal',
  loanTerm: '12',
  employmentStatus: '',
  monthlyIncome: '',
  location: '',
  address: '',
  idDocument: null,
  selfie: null,
  termsAgreed: false,
};

const PNG_LOCATIONS = [
  'Port Moresby (National Capital District)',
  'Lae (Morobe Province)',
  'Mount Hagen (Western Highlands)',
  'Madang (Madang Province)',
  'Wewak (East Sepik)',
  'Vanimo (Sandaun Province)',
  'Bougainville (Autonomous Region)',
  'Goroka (Eastern Highlands)',
  'Kokopo (East New Britain)',
  'Kimbe (West New Britain)',
  'Alotau (Milne Bay)',
  'Popondetta (Oro Province)',
  'Mendi (Southern Highlands)',
  'Wabag (Enga Province)',
  'Daru (Western Province)',
  'Kerema (Gulf Province)',
  'Kundiawa (Simbu Province)',
  'Lorengau (Manus Province)',
  'Kavieng (New Ireland)',
  'Rabaul (East New Britain)',
  'Kiunga (Western Province)',
  'Tabubil (Western Province)',
];

const EMPLOYMENT_STATUS = [
  'Full-time employed',
  'Part-time employed',
  'Self-employed',
  'Casual/Contract',
  'Unemployed',
  'Retired',
];

const LOAN_TERMS = [
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
  { value: '18', label: '18 months' },
  { value: '24', label: '24 months' },
  { value: '36', label: '36 months' },
  { value: '48', label: '48 months' },
  { value: '60', label: '60 months' },
];

export default function Apply() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [idPreview, setIdPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.loanAmount) newErrors.loanAmount = 'Loan amount is required';
    else if (Number(formData.loanAmount) < 500) newErrors.loanAmount = 'Minimum loan amount is K500';
    if (!formData.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
    if (!formData.monthlyIncome) newErrors.monthlyIncome = 'Monthly income is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    // Check age 18+
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.idDocument) newErrors.idDocument = 'ID document is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.termsAgreed) newErrors.termsAgreed = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setSubmitting(true);
    try {
      const refNum = await submitApplication({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        nationalId: formData.nationalId || undefined,
        loanAmount: Number(formData.loanAmount),
        loanType: formData.loanType,
        loanTerm: Number(formData.loanTerm),
        employmentStatus: formData.employmentStatus,
        monthlyIncome: Number(formData.monthlyIncome),
        location: formData.location,
        address: formData.address,
      });

      // Upload files if they exist
      if (formData.idDocument) {
        try {
          await uploadFile(formData.idDocument, refNum, `id-document.${formData.idDocument.name.split('.').pop()}`);
        } catch (e) {
          console.error('ID upload failed:', e);
        }
      }
      if (formData.selfie) {
        try {
          await uploadFile(formData.selfie, refNum, `selfie.${formData.selfie.name.split('.').pop()}`);
        } catch (e) {
          console.error('Selfie upload failed:', e);
        }
      }

      setReferenceNumber(refNum);
      setSubmitted(true);
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (field: 'idDocument' | 'selfie', file: File | null) => {
    updateField(field, file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'idDocument') setIdPreview(reader.result as string);
        else setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent, field: 'idDocument' | 'selfie') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      if (file.size <= 5 * 1024 * 1024) {
        handleFileChange(field, file);
      } else {
        setErrors((prev) => ({ ...prev, [field]: 'File must be under 5MB' }));
      }
    }
  };

  // Success State
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F5F5F0] pt-[100px] pb-20">
        <div className="max-w-[600px] mx-auto px-6">
          <div className="bg-white rounded-2xl border border-black/[0.08] p-10 lg:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center">
                <CheckCircle size={40} className="text-[#059669]" />
              </div>
            </div>
            <h1 className="font-display text-[32px] font-medium text-[#059669] mb-4">
              Application Submitted!
            </h1>
            <p className="text-[16px] font-body text-[#0F1419] mb-2">
              Your application is pending approval. Please wait 1–2 hours.
            </p>
            <p className="text-[14px] font-body text-[#6B7280] mb-6">
              We'll notify you by SMS and email.
            </p>
            <div className="bg-[#F5F5F0] rounded-lg p-4 mb-6">
              <p className="text-[13px] font-medium font-body text-[#6B7280] mb-1">Your Reference Number</p>
              <p className="font-display text-[24px] font-medium text-[#008080]">{referenceNumber}</p>
            </div>
            <p className="text-[13px] font-body text-[#6B7280] mb-8">
              For complaints or inquiries, contact support at{' '}
              <a href="mailto:trupelaloanorganisation@gmail.com" className="text-[#008080] hover:underline">
                trupelaloanorganisation@gmail.com
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/status"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#008080] text-white text-[14px] font-medium font-body rounded-lg hover:bg-[#006666] active:scale-[0.98] transition-all"
              >
                Check Application Status
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-[#008080] text-[#008080] text-[14px] font-medium font-body rounded-lg hover:bg-[#008080] hover:text-white active:scale-[0.98] transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F0] pt-[100px] pb-20">
      <div className="max-w-[720px] mx-auto px-6">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-medium transition-all duration-300 ${
                      step > s
                        ? 'bg-[#008080] text-white'
                        : step === s
                        ? 'bg-[#008080] text-white'
                        : 'bg-[#E5E5E5] text-[#6B7280]'
                    }`}
                  >
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  <span
                    className={`text-[12px] font-body mt-2 hidden sm:block ${
                      step >= s ? 'text-[#008080]' : 'text-[#6B7280]'
                    }`}
                  >
                    {s === 1 ? 'Personal Details' : s === 2 ? 'KYC Verification' : 'Review'}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                      step > s ? 'bg-[#008080]' : 'bg-[#E5E5E5]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-8 lg:p-12">
          {errors.submit && (
            <div className="mb-6 p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg text-[14px] font-body text-[#DC2626]">
              {errors.submit}
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-[28px] font-normal text-[#0F1419] mb-2">Personal Details</h2>
              <p className="text-[16px] font-body text-[#6B7280] mb-8">Please provide your basic information.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="John Smith"
                    className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] ${
                      errors.fullName ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                    }`}
                  />
                  {errors.fullName && <p className="text-[13px] font-body text-[#DC2626] mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="john@email.com"
                      className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] ${
                        errors.email ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                      }`}
                    />
                    {errors.email && <p className="text-[13px] font-body text-[#DC2626] mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+675 1234 5678"
                      className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] ${
                        errors.phone ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                      }`}
                    />
                    {errors.phone && <p className="text-[13px] font-body text-[#DC2626] mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Date of Birth *</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] ${
                        errors.dateOfBirth ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                      }`}
                    />
                    {errors.dateOfBirth && <p className="text-[13px] font-body text-[#DC2626] mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">National ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.nationalId}
                      onChange={(e) => updateField('nationalId', e.target.value)}
                      placeholder="PNG ID Number"
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Loan Amount (K) *</label>
                    <input
                      type="number"
                      value={formData.loanAmount}
                      onChange={(e) => updateField('loanAmount', e.target.value)}
                      placeholder="10000"
                      min="500"
                      className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] ${
                        errors.loanAmount ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                      }`}
                    />
                    {errors.loanAmount && <p className="text-[13px] font-body text-[#DC2626] mt-1">{errors.loanAmount}</p>}
                  </div>
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Loan Term *</label>
                    <select
                      value={formData.loanTerm}
                      onChange={(e) => updateField('loanTerm', e.target.value)}
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] bg-white"
                    >
                      {LOAN_TERMS.map((term) => (
                        <option key={term.value} value={term.value}>{term.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Loan Type *</label>
                  <div className="flex flex-wrap gap-3">
                    {(['personal', 'business', 'emergency'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => updateField('loanType', type)}
                        className={`px-4 py-2.5 rounded-lg text-[14px] font-medium font-body transition-all duration-200 ${
                          formData.loanType === type
                            ? 'bg-[#008080] text-white'
                            : 'bg-[#F5F5F0] text-[#0F1419] hover:bg-[#E5E5E0]'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)} Loan
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[13px] font-medium font-body text-[#0F1419] mb-1.5 block">Employment Status *</label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => updateField('employmentStatus', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg text-[16px] font-body outline-none transition-all duration-200 focus:border-[#008080] focus:shadow-[0_0_0_3px_rgba(0,128,128,0.1)] bg-white ${
                        errors.employmentStatus ? 'border-[#DC2626]' : 'border-[#E5E5E5]'
                      }`}
             
