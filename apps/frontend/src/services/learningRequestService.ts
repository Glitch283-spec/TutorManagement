import { supabase } from '../lib/supabase';
import { LearningRequest } from '../types';

const toUiStatus = (status: string): LearningRequest['status'] => {
  const value = (status || '').toLowerCase();
  if (value === 'pending') return 'Pending';
  if (value === 'processing') return 'Processing';
  if (value === 'assigned') return 'Assigned';
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

  async getAllRequests() {
    const { data: requestRows, error } = await supabase
      .from('learning_requests')
      .select('*')
      .order('created_date', { ascending: false });
      
    if (error) throw error;

    const requests = requestRows || [];
    if (requests.length === 0) return [];

    const parentIds = [...new Set(requests.map((r) => r.parent_id))];
    const { data: parentRows } = await supabase
      .from('parents')
      .select('parent_id, user_id')
      .in('parent_id', parentIds);

    const parentToUser = new Map<number, number>();
    for (const row of parentRows || []) {
      parentToUser.set(row.parent_id, row.user_id);
    }

    const userIds = [...new Set((parentRows || []).map((p) => p.user_id))];
    const { data: userRows } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    const usersById = new Map<number, { full_name: string; email: string }>();
    for (const user of userRows || []) {
      usersById.set(user.user_id, { full_name: user.full_name, email: user.email });
    }

    return requests.map((row) => {
      const userId = parentToUser.get(row.parent_id);
      const parentInfo = userId ? usersById.get(userId) : undefined;
      return mapRequest(row, parentInfo?.full_name, parentInfo?.email);
    });
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
