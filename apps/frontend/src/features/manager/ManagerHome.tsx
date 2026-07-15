import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { learningRequestService } from "../../services/learningRequestService";
import { LearningRequest } from "../../types";
import {
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import AssignTutorModal from "../../components/AssignTutorModal";

export const ManagerHome = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState<LearningRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await learningRequestService.getAllRequests();
      setRequests(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "Processing":
        return "bg-primary/10 text-primary border-primary/20";
      case "Assigned":
        return "bg-success/10 text-success border-success/20";
      case "Postponed":
        return "bg-warning/10 text-warning border-warning/20";
      case "Completed":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "Rejected":
      case "Cancelled":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const processingCount = requests.filter(
    (r) => r.status === "Processing",
  ).length;
  const assignedCount = requests.filter((r) => r.status === "Assigned").length;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Platform Overview</h1>
        <p className="text-secondary-text">
          Monitor platform activities and learning requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-container flex items-center p-6 bg-warning/5 border-warning/20">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-warning font-medium">Pending Requests</p>
            <p className="text-2xl font-bold text-text">{pendingCount}</p>
          </div>
        </div>

        <div className="card-container flex items-center p-6 bg-primary/5 border-primary/20">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
            <Loader2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-primary font-medium">
              Processing Requests
            </p>
            <p className="text-2xl font-bold text-text">{processingCount}</p>
          </div>
        </div>

        <div className="card-container flex items-center p-6 bg-success/5 border-success/20">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mr-4">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-success font-medium">
              Assigned Requests
            </p>
            <p className="text-2xl font-bold text-text">{assignedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Recent Requests</h2>
            <Link
              to="/review-request"
              className="text-primary hover:text-primary-hover text-sm font-medium flex items-center"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="card-container p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-border text-xs uppercase text-secondary-text tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Parent</th>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.slice(0, 5).map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-text">
                          {request.profiles?.full_name}
                        </p>
                        <p className="text-xs text-secondary-text">
                          {request.profiles?.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-medium text-text">
                        {request.student_name}
                      </td>
                      <td className="px-6 py-4 text-secondary-text">
                        {request.subject} - G{request.grade}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === "Processing" ? (
                          <button
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-hover transition"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowModal(true);
                            }}
                          >
                            Assign Tutor
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-text">Needs Attention</h2>
          {pendingCount === 0 ? (
            <div className="card-container text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-text font-medium">All caught up!</p>
              <p className="text-sm text-secondary-text">
                No pending requests to review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((r) => r.status === "Pending")
                .slice(0, 4)
                .map((request) => (
                  <Link
                    to={`/review-request`}
                    key={request.id}
                    className="block card-container p-4 hover:border-primary transition-colors hover:shadow-md cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                        {request.subject}
                      </h3>
                      <span className="text-xs text-secondary-text">
                        {format(new Date(request.created_at), "MMM dd")}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-text mb-1">
                      Student: {request.student_name}
                    </p>
                    <p className="text-xs text-secondary-text truncate">
                      {request.profiles?.full_name}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
      {selectedRequest && (
        <AssignTutorModal
          open={showModal}
          requestId={selectedRequest.id}
          onClose={() => setShowModal(false)}
          onAssigned={loadRequests}
        />
      )}
    </div>
  );
};
