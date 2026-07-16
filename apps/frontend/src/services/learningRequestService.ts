import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { LearningRequest } from '../types';
import { notificationService } from './notificationService';

const toUiStatus = (status: string): LearningRequest['status'] => {
  const value = (status || '').toLowerCase();
  if (value === 'pending') return 'Pending';
  if (value === 'processing') return 'Processing';
  if (value === 'assigned') return 'Assigned';
  if (value === 'postponed') return 'Postponed';
  if (value === 'completed') return 'Completed';
  if (value === 'cancelled') return 'Cancelled';
  if (value === 'rejected') return 'Rejected';
  return 'Pending';
};

const toDbStatus = (status: string) => status.toLowerCase();

const parseSchedule = (schedule?: string | null) => {
  if (!schedule) return { preferred_date: '', preferred_time: '' };
  const [preferred_date, preferred_time] = schedule.split('|').map((s) => s.trim());
  return {
    preferred_date: preferred_date || schedule,
    preferred_time: preferred_time || '',
  };
};

const mapRequest = (row: any, parentName?: string, parentEmail?: string): LearningRequest => {
  const parsed = parseSchedule(row.schedule);
  return {
    id: row.request_id,
    parent_id: row.parent_id,
    student_name: row.student_name,
    grade: row.grade,
    subject: row.subject,
    learning_method: (row.learning_method || 'online').toLowerCase(),
    preferred_date: parsed.preferred_date,
    preferred_time: parsed.preferred_time,
    location: row.location,
    special_requirements: row.note,
    status: toUiStatus(row.status),
    created_at: row.created_date,
    profiles: {
      full_name: parentName || 'Unknown Parent',
      email: parentEmail || '-',
    },
  };
};

export const learningRequestService = {
  async createRequest(requestData: Omit<LearningRequest, 'id' | 'created_at' | 'status' | 'profiles'>) {
    const schedule = [requestData.preferred_date, requestData.preferred_time]
      .filter(Boolean)
      .join(' | ');

    const { data, error } = await supabase
      .from('learning_requests')
      .insert([{
        parent_id: requestData.parent_id,
        student_name: requestData.student_name,
        grade: requestData.grade,
        subject: requestData.subject,
        learning_method: requestData.learning_method,
        schedule,
        location: requestData.location,
        note: requestData.special_requirements,
        status: 'pending',
      }])
      .select()
      .single();
      
    if (error) throw error;

    await notificationService.notifyManagers(
      `New learning request: ${requestData.subject} for ${requestData.student_name}.`
    );
    return data;
  },

  async getRequestsByParent(parentId: number) {
    const { data, error } = await supabase
      .from('learning_requests')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_date', { ascending: false });
      
    if (error) throw error;
    return (data || []).map((row) => mapRequest(row));
  },

  async getRequestByParent(id: string, parentId: number) {
    const { data, error } = await supabase
      .from('learning_requests')
      .select('*')
      .eq('request_id', id)
      .eq('parent_id', parentId)
      .single();

    if (error) throw error;
    return mapRequest(data);
  },

  async updateRequest(id: string, requestData: Omit<LearningRequest, 'id' | 'created_at' | 'status' | 'profiles'>) {
    const schedule = [requestData.preferred_date, requestData.preferred_time]
      .filter(Boolean)
      .join(' | ');

    const { data, error } = await supabase
      .from('learning_requests')
      .update({
        student_name: requestData.student_name,
        grade: requestData.grade,
        subject: requestData.subject,
        learning_method: requestData.learning_method,
        schedule,
        location: requestData.location,
        note: requestData.special_requirements,
      })
      .eq('request_id', id)
      .eq('parent_id', requestData.parent_id)
      .select()
      .single();

    if (error) throw error;
    return mapRequest(data);
  },

  async getAllRequests() {
    const { data } = await api.get<{ requests: any[] }>('/requests');
    return (data.requests || []).map((row) => mapRequest(row, row.parent_name, row.parent_email));
  },

  async getRequestById(id: string) {
    const all = await this.getAllRequests();
    return all.find((item) => String(item.id) === String(id)) || null;
  },

  async updateRequestStatus(id: string, status: string, notes?: string) {
    const updateData: any = { status: toDbStatus(status) };
    if (notes) updateData.note = notes;
    
    const { data, error } = await supabase
      .from('learning_requests')
      .update(updateData)
      .eq('request_id', id)
      .select()
      .single();
      
    if (error) throw error;
    return mapRequest(data);
  }
};
