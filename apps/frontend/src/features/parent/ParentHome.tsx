import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { learningRequestService } from '../../services/learningRequestService';
import { useAuth } from '../../hooks/useAuth';
import { LearningRequest } from '../../types';
import { PlusCircle, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ParentHome = () => {
  const [requests, setRequests] = useState<LearningRequest[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.parent_id) {
      loadRequests();
    }
  }, [profile?.parent_id]);

  const loadRequests = async () => {
    try {
      if (!profile?.parent_id) return;
      const data = await learningRequestService.getRequestsByParent(profile.parent_id);
      setRequests(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'Processing': return 'bg-primary/10 text-primary border-primary/20';
      case 'Assigned': return 'bg-success/10 text-success border-success/20';
      case 'Postponed': return 'bg-warning/10 text-warning border-warning/20';
      case 'Completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Rejected':
      case 'Cancelled': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">My Dashboard</h1>
          <p className="text-secondary-text">Overview of your learning requests</p>
        </div>
        <Link to="/create-request" className="btn-primary flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Request
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-container flex items-center p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-secondary-text font-medium">Total Requests</p>
            <p className="text-2xl font-bold text-text">{requests.length}</p>
          </div>
        </div>
        
        <div className="card-container flex items-center p-6 bg-warning/5 border-warning/20">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-warning font-medium">Pending</p>
            <p className="text-2xl font-bold text-text">{requests.filter(r => r.status === 'Pending').length}</p>
          </div>
        </div>

        <div className="card-container flex items-center p-6 bg-success/5 border-success/20">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mr-4">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-success font-medium">Completed</p>
            <p className="text-2xl font-bold text-text">{requests.filter(r => r.status === 'Completed').length}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-text mb-4">Recent Requests</h2>
      
      {requests.length === 0 ? (
        <div className="card-container text-center py-16">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No requests yet</h3>
          <p className="text-secondary-text mb-6">Create your first learning request to find a tutor.</p>
          <Link to="/create-request" className="btn-primary inline-flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Request
          </Link>
        </div>
      ) : (
        <div className="card-container overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-border text-xs uppercase text-secondary-text tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Grade</th>
                  <th className="px-6 py-4 font-medium">Date Created</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text">{request.student_name}</td>
                    <td className="px-6 py-4 text-secondary-text">{request.subject}</td>
                    <td className="px-6 py-4 text-secondary-text">Grade {request.grade}</td>
                    <td className="px-6 py-4 text-secondary-text">
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/parent/requests/${request.id}`} className="text-sm font-medium text-primary hover:text-primary-hover">View details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
