import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarDays, Clock3, Edit3, Plus, Save } from 'lucide-react';
import { PlanningData, ScheduleClass, teachingScheduleService } from '../../services/teachingScheduleService';

const emptyForm = { teachingDate: '', startTime: '', endTime: '', location: '', learningMethod: 'online' };

export const TeachingScheduleManagement = () => {
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [planning, setPlanning] = useState<PlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    teachingScheduleService.getClasses()
      .then((items) => { setClasses(items); setSelectedClassId(items[0]?.class_id ?? null); })
      .catch(() => toast.error('Unable to load classes'))
      .finally(() => setLoading(false));
  }, []);

  const loadPlanning = async (classId: number) => {
    try { setPlanning(await teachingScheduleService.getPlanningData(classId)); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load schedule details'); }
  };
  useEffect(() => { if (selectedClassId) loadPlanning(selectedClassId); }, [selectedClassId]);

  const scheduledDates = useMemo(() => {
    if (!planning) return [];
    const days = view === 'week' ? 7 : 31;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + days);
    return planning.tutorSchedules.filter((item) => {
      const date = new Date(`${item.teaching_date}T00:00:00`);
      return date >= start && date < end;
    });
  }, [planning, view]);
  const classSchedules = useMemo(() =>
    (planning?.tutorSchedules || [])
      .filter((item) => item.class_id === selectedClassId)
      .sort((a, b) => `${a.teaching_date}${a.start_time}`.localeCompare(`${b.teaching_date}${b.start_time}`)),
    [planning, selectedClassId]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClassId) return;
    setSaving(true);
    try {
      await teachingScheduleService.save({ scheduleId: editingId, classId: selectedClassId, ...form });
      toast.success(editingId ? 'Teaching schedule updated' : 'Teaching schedule created and parties notified');
      setForm(emptyForm); setEditingId(undefined);
      await loadPlanning(selectedClassId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to save teaching schedule');
    } finally { setSaving(false); }
  };

  const edit = (item: any) => {
    setEditingId(item.schedule_id);
    setForm({ teachingDate: item.teaching_date, startTime: item.start_time, endTime: item.end_time, location: item.location || '', learningMethod: item.learning_method || 'online' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="py-20 text-center text-secondary-text">Loading classes...</div>;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-text">Teaching Schedule Management</h1><p className="text-secondary-text">Plan sessions after tutor availability and conflict validation.</p></div>
      {classes.length === 0 ? <div className="card-container text-secondary-text">No classes have been created yet.</div> : <>
        <div className="card-container flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-text">Class</label>
          <select value={selectedClassId ?? ''} onChange={(event) => { setSelectedClassId(Number(event.target.value)); setForm(emptyForm); setEditingId(undefined); }} className="input-field max-w-md py-2">
            {classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.class_name || `Class #${item.class_id}`}</option>)}
          </select>
        </div>
        {planning && <>
          <div className="grid lg:grid-cols-3 gap-6">
            <form onSubmit={submit} className="card-container lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center"><h2 className="font-bold text-lg text-text">{editingId ? 'Update session' : 'Create teaching session'}</h2>{editingId && <button type="button" className="text-sm text-primary" onClick={() => { setEditingId(undefined); setForm(emptyForm); }}>Create new</button>}</div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Session date" type="date" value={form.teachingDate} onChange={(value) => setForm({ ...form, teachingDate: value })} />
                <Input label="Learning method" type="select" value={form.learningMethod} onChange={(value) => setForm({ ...form, learningMethod: value })} />
                <Input label="Start time" type="time" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
                <Input label="End time" type="time" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
                <div className="md:col-span-2"><Input label="Location / meeting link" value={form.location} onChange={(value) => setForm({ ...form, location: value })} /></div>
              </div>
              <button disabled={saving} className="btn-primary flex items-center"><Save className="w-4 h-4 mr-2" />{saving ? 'Validating...' : editingId ? 'Update schedule' : 'Confirm schedule'}</button>
            </form>
            <div className="card-container"><h2 className="font-bold text-lg text-text mb-3">Tutor availability</h2>{planning.availability.length === 0 ? <p className="text-sm text-danger">No availability schedule found.</p> : <div className="space-y-2">{planning.availability.filter((slot) => slot.status === 'available').map((slot) => <p key={slot.slot_id} className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success"><b>{slot.day_of_week}</b>: {slot.start_time}–{slot.end_time}</p>)}</div>}<h3 className="font-semibold text-sm text-text mt-5 mb-2">Approved leave</h3>{planning.leaves.filter((leave) => leave.status === 'approved').map((leave) => <p key={leave.leave_request_id} className="text-sm text-danger">{leave.start_date} to {leave.end_date}</p>) || <p className="text-sm text-secondary-text">None</p>}</div>
          </div>
          <div className="card-container">
            <div className="flex flex-wrap justify-between gap-3 mb-4"><div><h2 className="font-bold text-lg text-text">Tutor teaching calendar</h2><p className="text-sm text-secondary-text">Includes this tutor's sessions across all classes.</p></div><div className="flex rounded-lg border border-border overflow-hidden"><button onClick={() => setView('week')} className={`px-3 py-2 text-sm ${view === 'week' ? 'bg-primary text-white' : ''}`}>Week</button><button onClick={() => setView('month')} className={`px-3 py-2 text-sm ${view === 'month' ? 'bg-primary text-white' : ''}`}>Month</button></div></div>
            {scheduledDates.length === 0 ? <p className="py-8 text-center text-secondary-text">No sessions in the next {view === 'week' ? '7' : '31'} days.</p> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{scheduledDates.map((item) => <div key={item.schedule_id} className="rounded-xl border border-border p-4"><div className="flex justify-between"><p className="font-semibold text-text">{item.class_name}</p>{item.class_id === selectedClassId && <button onClick={() => edit(item)} className="text-primary" aria-label="Edit schedule"><Edit3 className="w-4 h-4" /></button>}</div><p className="mt-2 text-sm text-secondary-text"><CalendarDays className="inline w-4 h-4 mr-1" />{item.teaching_date}</p><p className="text-sm text-secondary-text"><Clock3 className="inline w-4 h-4 mr-1" />{item.start_time}–{item.end_time}</p></div>)}</div>}
          </div>
          <div className="card-container overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div><h2 className="font-bold text-lg text-text">Teaching Sessions for This Class</h2><p className="text-sm text-secondary-text">Sessions appear here immediately after they are saved.</p></div>
              <button onClick={() => { setEditingId(undefined); setForm(emptyForm); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-primary px-4 py-2 text-sm flex items-center"><Plus className="w-4 h-4 mr-2" />Add session</button>
            </div>
            {classSchedules.length === 0 ? <p className="p-8 text-center text-secondary-text">No teaching sessions have been created for this class.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 text-xs uppercase text-secondary-text"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Time</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">Location</th><th className="px-6 py-3">Tutor confirmation</th><th className="px-6 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">{classSchedules.map((item) => <tr key={item.schedule_id}><td className="px-6 py-4 text-text font-medium">{item.teaching_date}</td><td className="px-6 py-4 text-secondary-text">{item.start_time}–{item.end_time}</td><td className="px-6 py-4 text-secondary-text capitalize">{item.learning_method || '-'}</td><td className="px-6 py-4 text-secondary-text">{item.location || '-'}</td><td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.confirmation_status === 'completed' ? 'bg-success/10 text-success' : item.confirmation_status === 'postponed' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-secondary-text'}`}>{item.confirmation_status || 'pending'}</span>{item.confirmation_reason && <p className="mt-1 max-w-48 text-xs text-warning">Reason: {item.confirmation_reason}</p>}</td><td className="px-6 py-4 text-right">{item.confirmation_status === 'pending' || !item.confirmation_status ? <button onClick={() => edit(item)} className="text-sm font-medium text-primary hover:text-primary-hover">Edit</button> : <span className="text-xs text-secondary-text">Locked</span>}</td></tr>)}</tbody></table></div>}
          </div>
        </>}
      </>}
    </div>
  );
};

function Input({ label, type = 'text', value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <div><label className="block text-sm font-medium text-text mb-2">{label}</label>{type === 'select' ? <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field py-2"><option value="online">Online</option><option value="offline">Offline</option></select> : <input required={type !== 'text'} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-field py-2" />}</div>;
}
