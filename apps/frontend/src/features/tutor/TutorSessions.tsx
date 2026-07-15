import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Clock3, MapPin, MessageSquare, X } from 'lucide-react';
import { TutorSession, tutorSessionService } from '../../services/tutorSessionService';

export const TutorSessions = () => {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [selected, setSelected] = useState<TutorSession | null>(null);
  const [postponing, setPostponing] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSessions = async () => {
    try { setSessions(await tutorSessionService.getSessions()); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Unable to load teaching sessions'); }
  };
  useEffect(() => { loadSessions(); }, []);

  const confirm = async (status: 'completed' | 'postponed') => {
    if (!selected) return;
    if (status === 'postponed' && !reason.trim()) { toast.error('Please provide a postponement reason'); return; }
    setSaving(true);
    try {
      const updated = await tutorSessionService.confirm(selected.schedule_id, status, reason);
      setSessions((items) => items.map((item) => item.schedule_id === updated.schedule_id ? { ...item, ...updated } : item));
      setSelected({ ...selected, ...updated });
      setPostponing(false); setReason('');
      toast.success(status === 'completed' ? 'Session marked as completed' : 'Session postponed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to confirm session');
    } finally { setSaving(false); }
  };

  return <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
    <div><h1 className="text-2xl font-bold text-text">My Teaching Schedule</h1><p className="text-secondary-text">Select a session and confirm it after teaching. Confirmations are locked for salary calculation.</p></div>
    <div className="card-container overflow-hidden p-0">
      {sessions.length === 0 ? <p className="p-12 text-center text-secondary-text">No teaching sessions are scheduled for you.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50 text-xs uppercase text-secondary-text"><tr><th className="px-6 py-4">Class</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Time</th><th className="px-6 py-4">Confirmation</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-border">{sessions.map((item) => <tr key={item.schedule_id}><td className="px-6 py-4 font-medium text-text">{item.class_name}</td><td className="px-6 py-4 text-secondary-text">{item.teaching_date}</td><td className="px-6 py-4 text-secondary-text">{item.start_time}–{item.end_time}</td><td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.confirmation_status === 'completed' ? 'bg-success/10 text-success' : item.confirmation_status === 'postponed' ? 'bg-warning/10 text-warning' : 'bg-gray-100 text-secondary-text'}`}>{item.confirmation_status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => { setSelected(item); setPostponing(false); setReason(''); }} className="text-sm font-medium text-primary">View details</button></td></tr>)}</tbody></table></div>}
    </div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold text-text">{selected.class_name}</h2><p className="text-secondary-text">Session details</p></div><button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button></div><div className="mt-6 space-y-3 text-sm text-text"><p><Clock3 className="inline w-4 h-4 mr-2 text-primary" />{selected.teaching_date}, {selected.start_time}–{selected.end_time}</p><p><MapPin className="inline w-4 h-4 mr-2 text-primary" />{selected.location || 'No location specified'}</p><p><MessageSquare className="inline w-4 h-4 mr-2 text-primary" />{selected.learning_method || 'Not specified'}</p>{selected.confirmation_reason && <p className="rounded-lg bg-warning/10 p-3 text-warning">Postponement reason: {selected.confirmation_reason}</p>}</div>{selected.confirmation_status === 'pending' ? <div className="mt-6">{postponing && <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="input-field min-h-24 mb-3" placeholder="Why is this session being postponed?" />}<div className="flex justify-end gap-3"><button disabled={saving} onClick={() => postponing ? confirm('postponed') : setPostponing(true)} className="btn-secondary px-4 py-2">{postponing ? 'Submit postponement' : 'Postpone'}</button><button disabled={saving} onClick={() => confirm('completed')} className="btn-primary px-4 py-2"><CheckCircle2 className="inline w-4 h-4 mr-2" />Mark Completed</button></div></div> : <p className="mt-6 rounded-lg bg-gray-50 p-3 text-sm text-secondary-text">This session was confirmed as <b>{selected.confirmation_status}</b> and is locked from further changes.</p>}</div></div>}
  </div>;
};
