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

export type SessionUser = { id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin' }
export type Doctor = SessionUser
export type Appointment = { id: string; patientId: string; doctorId: string; date: string; slot: string; status: 'scheduled' | 'cancelled' | 'completed'; notes?: string }
export type Reminder = { id: string; patientId: string; medicineName: string; dosage: string; schedule: string; active: boolean }
export type MedicalRecord = { id: string; patientId: string; title: string; reportType: string; fileUrl?: string; summary?: string; uploadDate: string }
export type Prescription = { id: string; doctorId: string; doctorName: string; patientId: string; patientName: string; medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string; date: string; status: 'active' | 'completed' }
export type PatientSummary = { id: string; name: string; email: string; createdAt: string; totalAppointments: number; totalRecords: number; totalPrescriptions: number; lastAppointment: string }
export type UserSummary = { id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin'; createdAt: string }
export type NotificationItem = { id: string; userId: string; title: string; message: string; type: 'appointment' | 'medication' | 'system'; read: boolean; createdAt: string }
export type DoctorStats = { appointments: number; scheduledAppointments: number; patientsCount: number; prescriptionsCount: number; followUpsCount: number }

export const api = {
  register: (body: { name: string; email: string; password: string; role?: 'patient' | 'doctor' | 'admin' }) =>
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
  reminders: () => request<{ reminders: Reminder[] }>('/reminders'),
  createReminder: (body: { medicineName: string; dosage: string; schedule: string }) =>
    request<{ reminder: Reminder }>('/reminders', { method: 'POST', body: JSON.stringify(body) }),
  toggleReminder: (id: string, active: boolean) =>
    request<{ reminder: Reminder }>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  records: () => request<{ records: MedicalRecord[] }>('/records'),
  createRecord: (body: { title: string; reportType: string; fileUrl?: string }) =>
    request<{ record: MedicalRecord }>('/records', { method: 'POST', body: JSON.stringify(body) }),
  prescriptions: () => request<{ prescriptions: Prescription[] }>('/prescriptions'),
  createPrescription: (body: { patientId: string; medicineName: string; dosage: string; frequency: string; duration: string; instructions?: string }) =>
    request<{ prescription: Prescription }>('/prescriptions', { method: 'POST', body: JSON.stringify(body) }),
  togglePrescription: (id: string, status: 'active' | 'completed') =>
    request<{ prescription: Prescription }>(`/prescriptions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  patients: () => request<{ patients: PatientSummary[] }>('/patients'),
  users: () => request<{ users: UserSummary[] }>('/users'),
  updateUserRole: (id: string, role: 'patient' | 'doctor' | 'admin') =>
    request<{ user: UserSummary }>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  notifications: () => request<{ notifications: NotificationItem[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ notification: NotificationItem }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
  doctorStats: () => request<{ stats: DoctorStats }>('/doctor/stats'),
  askAi: (message: string) => request<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  adminStats: () => request<{ stats: { users: number; doctors: number; appointments: number; records: number; prescriptions?: number; patients?: number } }>('/admin/stats'),
}

