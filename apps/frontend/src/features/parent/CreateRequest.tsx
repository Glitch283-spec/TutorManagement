import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { learningRequestService } from '../../services/learningRequestService';
import { ArrowLeft, Save } from 'lucide-react';

export const CreateRequest = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!profile?.parent_id) throw new Error('Parent profile not found');
      
      await learningRequestService.createRequest({
        ...data,
        parent_id: profile.parent_id
      });
      
      toast.success('Learning request created successfully!');
      navigate('/parent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 text-secondary-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">Create Learning Request</h1>
          <p className="text-secondary-text">Fill in the details to find the perfect tutor.</p>
        </div>
      </div>

      <div className="card-container">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Student Name</label>
              <input
                {...register("student_name", { required: "Student name is required" })}
                className="input-field"
                placeholder="Enter student's full name"
              />
              {errors.student_name && <p className="mt-1 text-sm text-danger">{errors.student_name.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Grade</label>
              <select
                {...register("grade", { required: "Grade is required" })}
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled>Select a grade</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                  <option key={g} value={g.toString()}>Grade {g}</option>
                ))}
                <option value="University">University</option>
                <option value="Other">Other</option>
              </select>
              {errors.grade && <p className="mt-1 text-sm text-danger">{errors.grade.message as string}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text mb-2">Subject</label>
              <select
                {...register("subject", { required: "Subject is required" })}
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled>Select a subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Literature">Literature</option>
                <option value="English">English</option>
                <option value="IELTS">IELTS</option>
                <option value="Programming">Programming</option>
                <option value="Other">Other</option>
              </select>
              {errors.subject && <p className="mt-1 text-sm text-danger">{errors.subject.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Learning Method</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="online"
                    {...register("learning_method", { required: "Please select a method" })}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-text">Online</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="offline"
                    {...register("learning_method")}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-text">Offline</span>
                </label>
              </div>
              {errors.learning_method && <p className="mt-1 text-sm text-danger">{errors.learning_method.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Preferred Date (e.g. Mon, Wed)</label>
              <input
                {...register("preferred_date", { required: "Required" })}
                className="input-field"
                placeholder="e.g. Mon, Wed evenings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Preferred Time</label>
              <input
                {...register("preferred_time", { required: "Required" })}
                className="input-field"
                placeholder="e.g. 19:00 - 21:00"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">Location (for Offline)</label>
              <input
                {...register("location")}
                className="input-field"
                placeholder="Full address if offline learning"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">Special Requirements</label>
              <textarea
                {...register("special_requirements")}
                className="input-field min-h-[120px] resize-y"
                placeholder="Any special needs or tutor preferences..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
