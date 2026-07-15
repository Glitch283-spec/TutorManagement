import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { learningRequestService } from '../../services/learningRequestService';
import { notificationService } from '../../services/notificationService';
import { LearningRequest } from '../../types';

type RequestForm = Pick<LearningRequest,
  'student_name' | 'grade' | 'subject' | 'learning_method' |
  'preferred_date' | 'preferred_time' | 'location' | 'special_requirements'
>;

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [request, setRequest] = useState<LearningRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RequestForm>();

  useEffect(() => {
    const loadRequest = async () => {
      if (!id || !profile?.parent_id) return;
      try {
        const data = await learningRequestService.getRequestByParent(id, profile.parent_id);
        setRequest(data);
        reset(data);
      } catch {
        toast.error('Request not found');
        navigate('/parent');
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id, profile?.parent_id, navigate, reset]);

  const onSubmit = async (data: RequestForm) => {
    if (!id || !profile?.parent_id) return;
    try {
      const updated = await learningRequestService.updateRequest(id, {
        ...data,
        parent_id: profile.parent_id,
      });
      setRequest(updated);
      reset(updated);
      setEditing(false);
      toast.success('Request updated successfully');
      try {
        await Promise.all([
          notificationService.notifyMe(`Your learning request for ${updated.student_name} was updated successfully.`),
          notificationService.notifyManagers(`A parent updated the learning request for ${updated.student_name}.`),
        ]);
      } catch (notificationError) {
        console.error('Unable to create update notifications:', notificationError);
        toast.error('Request was updated, but notifications could not be sent.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to update request');
    }
  };

  if (loading) return <div className="py-16 text-center text-secondary-text">Loading request...</div>;
  if (!request) return null;

  const statusClass = request.status === 'Rejected' || request.status === 'Cancelled'
    ? 'bg-danger/10 text-danger border-danger/20'
    : request.status === 'Processing'
      ? 'bg-primary/10 text-primary border-primary/20'
      : request.status === 'Postponed'
        ? 'bg-warning/10 text-warning border-warning/20'
      : request.status === 'Assigned' || request.status === 'Completed'
        ? 'bg-success/10 text-success border-success/20'
        : 'bg-warning/10 text-warning border-warning/20';

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={() => navigate('/parent')} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-secondary-text" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">Learning Request</h1>
            <p className="text-secondary-text">Review or update your submitted details.</p>
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary flex items-center px-4 py-2">
            <Edit3 className="w-4 h-4 mr-2" /> Edit Request
          </button>
        )}
      </div>

      <div className="card-container mb-5 flex items-center justify-between">
        <span className="text-secondary-text">Current status</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>{request.status}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-container space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Student Name" error={errors.student_name?.message}>
            <input disabled={!editing} {...register('student_name', { required: 'Student name is required' })} className="input-field disabled:bg-gray-50" />
          </Field>
          <Field label="Grade" error={errors.grade?.message}>
            <select disabled={!editing} {...register('grade', { required: 'Grade is required' })} className="input-field disabled:bg-gray-50">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((grade) => <option key={grade} value={String(grade)}>Grade {grade}</option>)}
              <option value="University">University</option><option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Subject" error={errors.subject?.message}>
            <input disabled={!editing} {...register('subject', { required: 'Subject is required' })} className="input-field disabled:bg-gray-50" />
          </Field>
          <Field label="Learning Method" error={errors.learning_method?.message}>
            <select disabled={!editing} {...register('learning_method', { required: 'Learning method is required' })} className="input-field disabled:bg-gray-50">
              <option value="online">Online</option><option value="offline">Offline</option>
            </select>
          </Field>
          <Field label="Preferred Date" error={errors.preferred_date?.message}>
            <input disabled={!editing} {...register('preferred_date', { required: 'Preferred date is required' })} className="input-field disabled:bg-gray-50" />
          </Field>
          <Field label="Preferred Time" error={errors.preferred_time?.message}>
            <input disabled={!editing} {...register('preferred_time', { required: 'Preferred time is required' })} className="input-field disabled:bg-gray-50" />
          </Field>
        </div>
        <Field label="Location">
          <input disabled={!editing} {...register('location')} className="input-field disabled:bg-gray-50" />
        </Field>
        <Field label="Special Requirements">
          <textarea disabled={!editing} {...register('special_requirements')} className="input-field min-h-32 disabled:bg-gray-50" />
        </Field>
        {editing && (
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={() => { reset(request); setEditing(false); }} className="btn-secondary px-4 py-2">
              <X className="w-4 h-4 mr-2 inline" /> Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2">
              <Save className="w-4 h-4 mr-2 inline" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-text mb-2">{label}</label>{children}{error && <p className="mt-1 text-sm text-danger">{error}</p>}</div>;
}
