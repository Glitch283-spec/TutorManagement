import { supabase } from "../lib/supabase";
import { Tutor } from "../types";

export const tutorService = {
  async getAllTutors(): Promise<Tutor[]> {
    // Lấy danh sách tutor
    const { data: tutorRows } = await supabase
      .from("tutors")
      .select("*")
      .eq("status", "active");

    if (!tutorRows || tutorRows.length === 0) return [];

    // Lấy user tương ứng
    const userIds = tutorRows.map((t) => t.user_id);

    const { data: userRows, error: userError } = await supabase
      .from("users")
      .select("user_id, full_name, email")
      .in("user_id", userIds);

    if (userError) throw userError;

    return tutorRows.map((tutor) => {
      const user = userRows?.find((u) => u.user_id === tutor.user_id);

      return {
        tutor_id: tutor.tutor_id,
        user_id: tutor.user_id,
        full_name: user?.full_name || "Unknown",
        email: user?.email || "",
        experience: tutor.experience,
        status: tutor.status,
      };
    });
  },

  async assignTutor(requestId: number, tutorId: number) {
    // tạo assignment
    const { error: assignError } = await supabase.from("assignments").insert({
      request_id: requestId,
      tutor_id: tutorId,
    });

    if (assignError) throw assignError;

    // update request
    const { error: requestError } = await supabase
      .from("learning_requests")
      .update({
        status: "assigned",
      })
      .eq("request_id", requestId);

    if (requestError) throw requestError;
  },
};
