import { supabase } from '../lib/supabase';
import { ClassToRate, RatingPayload } from '../types'; // Đảm bảo import từ file types chung

export const ratingService = {
    async getClassesToRate(parentId: number): Promise<ClassToRate[]> {
        // 1. Truy vấn chuẩn từ classes -> assignments -> learning_requests & tutors
        const { data: classRows, error } = await supabase
            .from('classes')
            .select(`
        class_id,
        assignments!inner (
          tutor_id,
          learning_requests!inner (
            parent_id,
            subject,
            status
          ),
          tutors!inner (
            users!inner (
              full_name
            )
          )
        ),
        ratings (
          parent_id
        )
      `)
            .eq('assignments.learning_requests.parent_id', parentId)
            // Chỉ lấy các lớp có yêu cầu ở trạng thái Assigned hoặc Completed
            .in('assignments.learning_requests.status', ['assigned', 'Assigned', 'completed', 'Completed']);

        console.log("Dữ liệu Supabase trả về:", classRows); // <--- THÊM DÒNG NÀY

        if (error) {
            console.error("Lỗi truy vấn:", error); // <--- THÊM DÒNG NÀY
            throw error;
        }

        if (error) throw error;
        if (!classRows || classRows.length === 0) return [];

        // 2. Format lại dữ liệu cho Frontend
        return classRows.map((item: any) => {
            // Kiểm tra xem parent_id này đã có trong mảng ratings của class này chưa
            const isRated = item.ratings?.some(
                (r: any) => Number(r.parent_id) === Number(parentId)
            ) || false;

            return {
                class_id: item.class_id, // Đã lấy được class_id chuẩn xịn
                tutor_id: item.assignments.tutor_id,
                tutor_name: item.assignments.tutors.users.full_name || 'Unknown',
                subject: item.assignments.learning_requests.subject,
                request_status: item.assignments.learning_requests.status,
                completed_sessions: 0, // Theo yêu cầu, tạm bỏ qua việc đếm buổi học
                is_rated: isRated,
            };
        });
    },

    async submitRating(payload: RatingPayload) {
        // Insert thẳng vào bảng ratings với class_id chuẩn
        const { error } = await supabase
            .from('ratings')
            .insert({
                parent_id: payload.parent_id,
                tutor_id: payload.tutor_id,
                class_id: payload.class_id,
                score: payload.score,
                comment: payload.comment,
            });

        if (error) throw error;
    },
};