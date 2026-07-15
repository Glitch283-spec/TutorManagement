import { api } from '../lib/api';

export interface TeachingSchedule {
  schedule_id: number;
  class_id: number;
  class_name?: string;
  teaching_date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  learning_method?: string | null;
  status: string;
  confirmation_status?: 'pending' | 'completed' | 'postponed';
  confirmation_reason?: string | null;
  confirmed_date?: string | null;
}

export interface ScheduleClass {
  class_id: number;
  assignment_id: number;
  class_name: string;
  start_date?: string;
  end_date?: string;
  status: string;
}

export interface PlanningData {
  lessonClass: ScheduleClass;
  availability: { slot_id: number; day_of_week: string; start_time: string; end_time: string; status: string }[];
  leaves: { leave_request_id: number; start_date: string; end_date: string; status: string }[];
  tutorSchedules: TeachingSchedule[];
}

export const teachingScheduleService = {
  async getClasses() {
    const { data } = await api.get<{ classes: ScheduleClass[] }>('/schedules/classes');
    return data.classes;
  },
  async getPlanningData(classId: number) {
    const { data } = await api.get<PlanningData>(`/schedules/classes/${classId}`);
    return data;
  },
  async save(input: { scheduleId?: number; classId: number; teachingDate: string; startTime: string; endTime: string; location?: string; learningMethod?: string }) {
    const { scheduleId, ...body } = input;
    const request = scheduleId
      ? api.patch<{ schedule: TeachingSchedule }>(`/schedules/${scheduleId}`, body)
      : api.post<{ schedule: TeachingSchedule }>('/schedules', body);
    const { data } = await request;
    return data.schedule;
  },
};
