import { useEffect, useState } from "react";
import { Tutor } from "../types";
import { tutorService } from "../services/tutorService";

interface Props {
  requestId: number;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignTutorModal({
  requestId,
  open,
  onClose,
  onAssigned,
}: Props) {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadTutors();
  }, [open]);

  const loadTutors = async () => {
    const data = await tutorService.getAllTutors();
    console.log(data);

    setTutors(data);
  };

  const handleAssign = async (tutorId: number) => {
    try {
      setLoading(true);

      await tutorService.assignTutor(requestId, tutorId);

      alert("Tutor assigned successfully!");

      onAssigned();

      onClose();
    } catch (err) {
      console.error(err);
      alert("Assign failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px]">
        <h2 className="text-xl font-bold mb-4">Assign Tutor</h2>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tutors.map((tutor) => (
            <div
              key={tutor.tutor_id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{tutor.full_name}</p>

                <p className="text-sm">{tutor.email}</p>

                <p className="text-sm">Experience : {tutor.experience} years</p>
              </div>

              <button
                disabled={loading}
                onClick={() => handleAssign(tutor.tutor_id)}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Assign
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 text-right">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
