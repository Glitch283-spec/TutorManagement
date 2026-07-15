import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Star, MessageSquare, CheckCircle, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { useAuth } from '../../hooks/useAuth'; // Đảm bảo đường dẫn này khớp với project của bạn
import { ratingService } from '../../services/ratingService';
import { ClassToRate, RatingPayload } from '../../types'; // Import từ file types/index.ts

const RESTRICTED_KEYWORDS = ['lừa đảo', 'tệ nạn', 'chửi', 'ngu', 'kém'];

export const RateTutor = () => {
  // Lấy thông tin phụ huynh đang đăng nhập
  // Lấy thông tin profile từ useAuth
  const { profile } = useAuth(); 
  
  // Trích xuất parent_id từ profile
  const parentId = profile?.parent_id;

  const [classes, setClasses] = useState<ClassToRate[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassToRate | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchClasses = async () => {
      if (!parentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await ratingService.getClassesToRate(parentId);
        setClasses(data);
      } catch (error) {
        toast.error('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
        console.error("Fetch classes error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [parentId]);

  const handleOpenRateModal = (classItem: ClassToRate) => {
    // Chuyển status về chữ thường để so sánh cho an toàn
    const status = classItem.request_status?.toLowerCase();
    if (status !== 'assigned' && status !== 'completed') {
      toast.error('Chỉ có thể đánh giá gia sư khi lớp học đã được phân công (Assigned).');
      return;
    }
    
    setSelectedClass(classItem);
    setRating(0);
    reset();
  };

  const onSubmit = async (data: any) => {
    if (!parentId) {
      toast.error('Lỗi xác thực: Không tìm thấy thông tin tài khoản phụ huynh!');
      return;
    }

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá!');
      return;
    }

    if (rating < 3 && (!data.reason || data.reason.trim() === '')) {
      toast.error('Vui lòng nhập lý do cụ thể cho đánh giá thấp.');
      return;
    }

    const commentLower = (data.comment || '').toLowerCase();
    const containsInappropriateContent = RESTRICTED_KEYWORDS.some(keyword => 
      commentLower.includes(keyword)
    );

    try {
      if (!selectedClass) return;

      let finalComment = data.comment || '';
      if (rating < 3 && data.reason) {
        finalComment = `[Lý do đánh giá thấp: ${data.reason}] ${finalComment}`;
      }
      if (containsInappropriateContent) {
        finalComment = `[CẦN ADMIN DUYỆT - TỪ KHÓA NHẠY CẢM] ${finalComment}`;
      }

      // Payload chuẩn bị gửi xuống service
      const payload: RatingPayload = {
        parent_id: parentId,
        class_id: selectedClass.class_id,
        tutor_id: selectedClass.tutor_id,
        score: rating,
        comment: finalComment.trim(),
      };

      await ratingService.submitRating(payload);

      // Cập nhật lại UI lập tức không cần reload trang
      setClasses(classes.map(c => 
        c.class_id === selectedClass.class_id ? { ...c, is_rated: true } : c
      ));

      if (containsInappropriateContent) {
        toast.success('Đánh giá đã được lưu. Nhận xét của bạn đang chờ Admin duyệt do chứa từ khóa nhạy cảm.', { duration: 5000 });
      } else {
        toast.success('Đánh giá gia sư thành công!');
      }
      
      setSelectedClass(null);
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi gửi đánh giá');
      console.error("Submit rating error:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!parentId) {
    return (
      <div className="p-6 text-center text-secondary-text">
        Vui lòng đăng nhập với tài khoản phụ huynh để xem tính năng này.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Đánh giá Gia sư</h1>
        <p className="text-secondary-text mt-1">Phản hồi của bạn giúp chúng tôi cải thiện chất lượng giảng dạy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-secondary-text">Bạn chưa có lớp học nào cần đánh giá.</p>
          </div>
        ) : (
          classes.map((cls) => {
            const status = cls.request_status?.toLowerCase();
            const canRate = status === 'assigned' || status === 'completed';

            return (
              <motion.div 
                key={cls.class_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-container flex items-center justify-between p-5 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text text-lg">{cls.tutor_name}</h3>
                    <p className="text-sm text-secondary-text">{cls.subject}</p>
                    <p className="text-xs font-medium mt-1 text-gray-500">
                      Trạng thái: <span className="uppercase text-primary">{cls.request_status}</span>
                    </p>
                  </div>
                </div>
                
                {cls.is_rated ? (
                  <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full shrink-0">
                    <CheckCircle className="w-4 h-4 mr-1" /> Đã đánh giá
                  </span>
                ) : !canRate ? (
                  <button disabled className="px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed shrink-0">
                    Chưa thể đánh giá
                  </button>
                ) : (
                  <button 
                    onClick={() => handleOpenRateModal(cls)}
                    className="btn-primary px-4 py-2 text-sm shrink-0"
                  >
                    Đánh giá
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-text mb-2">Đánh giá {selectedClass.tutor_name}</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-sm font-medium text-text">Chất lượng giảng dạy & thái độ</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating) 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {rating > 0 && rating < 3 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-sm font-medium text-danger mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Lý do đánh giá thấp (Bắt buộc)
                    </label>
                    <textarea
                      {...register("reason", { required: rating < 3 })}
                      rows={2}
                      className="input-field w-full resize-none border border-red-300 focus:ring-red-500 rounded-lg p-3"
                      placeholder="Gia sư đi trễ, dạy khó hiểu..."
                    />
                    {errors.reason && <p className="text-xs text-danger mt-1">Vui lòng cung cấp lý do để chúng tôi xử lý.</p>}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Nhận xét chi tiết (Tùy chọn)</label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      {...register("comment")}
                      rows={3}
                      className="input-field pl-10 pt-3 w-full resize-none border border-gray-300 rounded-lg"
                      placeholder="Chia sẻ trải nghiệm học tập..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setSelectedClass(null)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors">
                    Hủy
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};