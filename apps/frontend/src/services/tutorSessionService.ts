import { api } from '../lib/api';

export interface TutorSession {
  schedule_id: number;
  class_id: number;
  class_name: string;
  teaching_date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  learning_method?: string | null;
  status: string;
  confirmation_status: 'pending' | 'completed' | 'postponed';
  confirmation_reason?: string | null;
  confirmed_date?: string | null;
}

export const tutorSessionService = {
  async getSessions() {
    const { data } = await api.get<{ sessions: TutorSession[] }>('/schedules/tutor/sessions');
    return data.sessions;
  },
  async confirm(scheduleId: number, confirmationStatus: 'completed' | 'postponed', reason?: string) {
    const { data } = await api.patch<{ session: TutorSession }>(`/schedules/tutor/sessions/${scheduleId}/confirmation`, { confirmationStatus, reason });
    return data.session;
  },
};
