import { useState, useEffect } from 'react';
import { learningRequestService } from '../../services/learningRequestService';
import { toast } from 'react-hot-toast';
import { Loader2, Search, Filter, Eye, X, Check, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export const ReviewRequest = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  
  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await learningRequestService.getAllRequests();
      setRequests(data?.filter(r => r.status === 'Pending') || []); // Screen A: Pending Request List
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedRequest) return;
    try {
      await learningRequestService.updateRequestStatus(selectedRequest.id, 'Processing');
      toast.success('Request accepted and moved to Processing');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      // Assuming we had a reject_reason column we would update it here
      await learningRequestService.updateRequestStatus(selectedRequest.id, 'Rejected', reason);
      toast.success('Request rejected');
      setShowRejectModal(false);
      setReason('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      toast.error('Failed to reject request');
    }
  };

  const handleMoreInfo = async () => {
    if (!selectedRequest || !reason.trim()) {
      toast.error('Please provide a message');
      return;
    }
    try {
      // In a real app we'd save this message to a communications table or similar
      toast.success('Message sent to parent');
      setShowMoreInfoModal(false);
      setReason('');
      setSelectedRequest(null);
      // Status remains Pending
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  if (loading && requests.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // --- Screen B: Detail View ---
  if (selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto pb-10">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => setSelectedRequest(null)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100 text-secondary-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">Review Request Detail</h1>
            <p className="text-secondary-text">Evaluate the request and take action</p>
          </div>
        </div>

        <div className="card-container mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <p className="text-sm text-secondary-text mb-1">Parent Name</p>
              <p className="font-medium text-text">{selectedRequest.profiles?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Parent Email</p>
              <p className="font-medium text-text">{selectedRequest.profiles?.email}</p>
            </div>
            <div className="col-span-1 md:col-span-2 border-b border-border my-2"></div>
            
            <div>
              <p className="text-sm text-secondary-text mb-1">Student</p>
              <p className="font-medium text-text">{selectedRequest.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Grade</p>
              <p className="font-medium text-text">{selectedRequest.grade}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Subject</p>
              <p className="font-medium text-text">{selectedRequest.subject}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Learning Method</p>
              <p className="font-medium text-text capitalize">{selectedRequest.learning_method}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Preferred Date</p>
              <p className="font-medium text-text">{selectedRequest.preferred_date}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text mb-1">Preferred Time</p>
              <p className="font-medium text-text">{selectedRequest.preferred_time}</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-secondary-text mb-1">Location</p>
              <p className="font-medium text-text">{selectedRequest.location || 'N/A'}</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-secondary-text mb-1">Special Requirements</p>
              <div className="p-4 bg-gray-50 rounded-xl mt-1 text-text text-sm">
                {selectedRequest.special_requirements || 'None provided'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={handleAccept} className="btn-primary flex items-center bg-success hover:bg-green-600">
            <Check className="w-5 h-5 mr-2" />
            Accept
          </button>
          <button onClick={() => setShowRejectModal(true)} className="btn-danger flex items-center">
            <X className="w-5 h-5 mr-2" />
            Reject
          </button>
          <button onClick={() => setShowMoreInfoModal(true)} className="btn-secondary flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Request More Info
          </button>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-text mb-4">Reject Request</h3>
              <p className="text-sm text-secondary-text mb-4">Are you sure you want to reject this request? Please provide a reason.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field min-h-[100px] mb-6"
                placeholder="Reason for rejection..."
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowRejectModal(false); setReason(''); }} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleReject} className="btn-danger px-4 py-2">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* More Info Modal */}
        {showMoreInfoModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-text mb-4">Request More Information</h3>
              <p className="text-sm text-secondary-text mb-4">Send a message to the parent to clarify details.</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field min-h-[100px] mb-6"
                placeholder="What information do you need?"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowMoreInfoModal(false); setReason(''); }} className="btn-secondary px-4 py-2">Cancel</button>
                <button onClick={handleMoreInfo} className="btn-primary px-4 py-2">Send Message</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Screen A: List View ---
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Pending Requests</h1>
        <p className="text-secondary-text">Review and manage new tutor requests.</p>
      </div>

      <div className="card-container overflow-hidden p-0">
        <div className="flex items-center justify-between p-4 border-b border-border bg-gray-50/50">
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search requests..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center text-sm font-medium text-secondary-text hover:text-text px-3 py-2 border border-border rounded-lg bg-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-secondary-text">No pending requests at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-border text-xs uppercase text-secondary-text tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Grade</th>
                  <th className="px-6 py-4 font-medium">Created Date</th>
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
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border bg-warning/10 text-warning border-warning/20`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedRequest(request)}
                        className="btn-secondary px-4 py-2 text-sm flex items-center justify-center ml-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
