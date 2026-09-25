const defaultApiUrl = import.meta.env.PROD
  ? 'https://ai-medical-assistance-hoyu.onrender.com/api'
  : 'http://localhost:4000/api'

const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '')

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message ?? 'Something went wrong')
  return payload as T
}

export type SessionUser = { id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin'; specialty?: string }
export type Doctor = SessionUser
export type Appointment = { id: string; patientId: string; doctorId: string; date: string; slot: string; status: 'scheduled' | 'cancelled' | 'completed'; notes?: string }
export type Reminder = { id: string; patientId: string; medicineName: string; dosage: string; schedule: string; active: boolean }
export type MedicalRecord = { id: string; patientId: string; title: string; reportType: string; fileUrl?: string; summary?: string; uploadDate: string }

export const api = {
  register: (body: { name: string; email: string; password: string; role: SessionUser['role']; specialty?: string }) =>
    request<{ user: SessionUser }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: SessionUser }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<SessionUser>('/auth/me'),
  doctors: () => request<{ doctors: Doctor[] }>('/doctors'),
  appointments: () => request<{ appointments: Appointment[] }>('/appointments'),
  createAppointment: (body: { doctorId: string; date: string; slot: string; notes?: string }) =>
    request<{ appointment: Appointment }>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  cancelAppointment: (appointmentId: string) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/cancel`, { method: 'PATCH' }),
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) =>
    request<{ appointment: Appointment }>(`/appointments/${appointmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reminders: () => request<{ reminders: Reminder[] }>('/reminders'),
  createReminder: (body: { medicineName: string; dosage: string; schedule: string }) =>
    request<{ reminder: Reminder }>('/reminders', { method: 'POST', body: JSON.stringify(body) }),
  toggleReminder: (id: string, active: boolean) =>
    request<{ reminder: Reminder }>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  deleteReminder: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),
  records: (type?: string) => request<{ records: MedicalRecord[] }>(`/records${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  createRecord: (body: { title: string; reportType: string; fileUrl?: string; summary?: string; patientId?: string }) =>
    request<{ record: MedicalRecord }>('/records', { method: 'POST', body: JSON.stringify(body) }),
  uploadRecord: (body: { title: string; reportType: string; filename: string; summary?: string }) =>
    request<{ record: MedicalRecord }>('/records/upload', { method: 'POST', body: JSON.stringify(body) }),
  askAi: (message: string) => request<{ reply: string; provider: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  notifications: () => request<{ notifications: Array<{ id: string; type: string; title: string; body: string; createdAt: string }> }>('/notifications'),
  doctorPatients: () => request<{ patients: SessionUser[] }>('/doctor/patients'),
  createPrescription: (body: { patientId: string; title: string; summary: string }) =>
    request<{ record: MedicalRecord }>('/doctor/prescriptions', { method: 'POST', body: JSON.stringify(body) }),
  adminUsers: () => request<{ users: SessionUser[] }>('/admin/users'),
  updateUserRole: (id: string, role: SessionUser['role']) =>
    request<{ user: SessionUser }>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  adminStats: () => request<{ stats: { users: number; doctors: number; appointments: number; records: number } }>('/admin/stats'),
}
