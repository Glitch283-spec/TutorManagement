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
    // 1. Lấy thông tin subject và grade từ learning_requests
    const { data: requestInfo, error: fetchError } = await supabase
      .from("learning_requests")
      .select("subject, grade")
      .eq("request_id", requestId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Tạo assignment
    const { data: assignmentData, error: assignError } = await supabase
      .from("assignments")
      .insert({
        request_id: requestId,
        tutor_id: tutorId,
      })
      .select()
      .single();

    if (assignError) throw assignError;
    const startDate = new Date();

    
    // Tạo đối tượng end_date từ ngày hiện tại
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Tự động cộng 1 tháng và xử lý nhảy năm/tháng

    // Chuyển đổi sang định dạng YYYY-MM-DD để lưu vào DB
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const { error: classError } = await supabase
      .from("classes")
      .insert({
        assignment_id: assignmentData.assignment_id,
        class_name: `${requestInfo.subject} - Lớp ${requestInfo.grade}`,
        start_date: startStr,
        end_date: endStr, // Đã cộng thêm 1 tháng
        status: "active"
      });

    if (classError) throw classError;

    // 4. Update trạng thái request
    const { error: requestError } = await supabase
      .from("learning_requests")
      .update({ status: "Assigned" })
      .eq("request_id", requestId);

    if (requestError) throw requestError;
  }
};