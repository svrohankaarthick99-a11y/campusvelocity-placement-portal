import {
  User,
  StudentProfileData,
  CompanyData,
  JobData,
  ApplicationData,
  AuditLogData,
  ApplicationStatus,
} from '../types.ts';

const TOKEN_KEY = 'campus_velocity_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; [key: string]: any }> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.reasons = data?.reasons;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.token) tokenStorage.set(res.token);
      return res;
    },
    register: async (payload: any) => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.token) tokenStorage.set(res.token);
      return res;
    },
    quickSwitch: async (role: 'STUDENT' | 'RECRUITER' | 'ADMIN') => {
      const res = await apiRequest('/api/auth/quick-switch', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (res.token) tokenStorage.set(res.token);
      return res;
    },
    me: async () => {
      return apiRequest('/api/auth/me');
    },
    logout: () => {
      tokenStorage.clear();
    },
  },

  // Student Endpoints
  student: {
    getDashboardSummary: async () => {
      return apiRequest('/api/students/dashboard-summary');
    },
    getProfile: async () => {
      return apiRequest<{ profile: StudentProfileData }>('/api/students/profile');
    },
    updateProfile: async (payload: Partial<StudentProfileData>) => {
      return apiRequest('/api/students/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    getJobs: async (params: Record<string, any> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
      return apiRequest<{ count: number; jobs: JobData[] }>(`/api/students/jobs?${query.toString()}`);
    },
    getJobDetails: async (id: string) => {
      return apiRequest<{ job: JobData }>(`/api/students/jobs/${id}`);
    },
    apply: async (jobId: string) => {
      return apiRequest('/api/students/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      });
    },
    getApplications: async () => {
      return apiRequest<{ applications: ApplicationData[] }>('/api/students/applications');
    },
    getApplicationDetails: async (id: string) => {
      return apiRequest<{ application: ApplicationData }>(`/api/students/applications/${id}`);
    },
  },

  // Recruiter Endpoints
  recruiter: {
    getDashboardSummary: async () => {
      return apiRequest('/api/recruiter/dashboard-summary');
    },
    getCompany: async () => {
      return apiRequest<{ company: CompanyData }>('/api/recruiter/company');
    },
    updateCompany: async (payload: Partial<CompanyData>) => {
      return apiRequest('/api/recruiter/company', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    getJobs: async () => {
      return apiRequest<{ count: number; jobs: JobData[] }>('/api/recruiter/jobs');
    },
    createJob: async (payload: any) => {
      return apiRequest('/api/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateJob: async (id: string, payload: any) => {
      return apiRequest(`/api/recruiter/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    getApplicants: async (jobId: string) => {
      return apiRequest<{ job: any; applicants: any[] }>(`/api/recruiter/jobs/${jobId}/applicants`);
    },
    updateApplicantStatus: async (
      applicationId: string,
      status: ApplicationStatus,
      remarks?: string,
      extra?: { interviewDate?: string; interviewFormat?: string; offerLetterRef?: string }
    ) => {
      return apiRequest(`/api/recruiter/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks, ...extra }),
      });
    },
    batchUpdateApplicantStatus: async (
      applicationIds: string[],
      status: ApplicationStatus,
      remarks?: string
    ) => {
      return apiRequest('/api/recruiter/applications/batch-status', {
        method: 'PATCH',
        body: JSON.stringify({ applicationIds, status, remarks }),
      });
    },
    addCandidateProfile: async (payload: {
      name: string;
      email: string;
      registrationNumber?: string;
      branch?: string;
      cgpa?: number;
      graduationYear?: number;
      resumeLink?: string;
      skills?: string[] | string;
      jobId: string;
      status?: ApplicationStatus;
      remarks?: string;
    }) => {
      return apiRequest('/api/recruiter/candidate-profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getAllCompanies: async () => {
      return apiRequest<{ companies: CompanyData[] }>('/api/recruiter/all-companies');
    },
  },

  // Admin Endpoints
  admin: {
    getDashboard: async () => {
      return apiRequest('/api/admin/dashboard');
    },
    getCompanies: async (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return apiRequest<{ count: number; companies: CompanyData[] }>(`/api/admin/companies${q}`);
    },
    approveCompany: async (id: string, remarks?: string) => {
      return apiRequest(`/api/admin/companies/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks }),
      });
    },
    rejectCompany: async (id: string, reason: string, remarks?: string) => {
      return apiRequest(`/api/admin/companies/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason, remarks }),
      });
    },
    getJobs: async (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return apiRequest<{ count: number; jobs: JobData[] }>(`/api/admin/jobs${q}`);
    },
    approveJob: async (id: string, remarks?: string) => {
      return apiRequest(`/api/admin/jobs/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks }),
      });
    },
    rejectJob: async (id: string, reason: string, remarks?: string) => {
      return apiRequest(`/api/admin/jobs/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason, remarks }),
      });
    },
    getStudents: async () => {
      return apiRequest<{ count: number; students: any[] }>('/api/admin/students');
    },
    getApplications: async (params: Record<string, any> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
      return apiRequest<{ count: number; applications: ApplicationData[] }>(
        `/api/admin/applications?${query.toString()}`
      );
    },
    getAuditLogs: async (params: Record<string, any> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
      return apiRequest<{ count: number; logs: AuditLogData[] }>(
        `/api/admin/audit-logs?${query.toString()}`
      );
    },
  },
};
