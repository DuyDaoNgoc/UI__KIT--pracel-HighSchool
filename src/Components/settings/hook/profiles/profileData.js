import axiosInstance from "../../../../api/axiosConfig";
// Fetch grades (điểm số)
export const fetchGrades = async (userId) => {
    try {
        // id người dùng
        console.log("Fetching grades for userId:", userId);
        // Gọi API để lấy điểm
        const { data } = await axiosInstance.get(`/api/grades/${userId}`);
        // Trả về danh sách điểm hoặc mảng rỗng nếu không có
        return data.grades ?? [];
        // Xử lý lỗi
    }
    catch (err) {
        console.error("Error fetching grades:", err.response?.data || err.message);
        return [];
    }
};
// Fetch credits (điểm tích lũy) têng biến userId thay vì id để tránh nhầm với _id của credit object trong db
export const fetchCredits = async (userId) => {
    try {
        // id người dùng
        console.log("Fetching credits for userId:", userId);
        // Gọi API để lấy điểm tích lũy
        const { data } = await axiosInstance.get(`/api/credits/${userId}`);
        // Trả về dữ liệu điểm tích lũy
        return data;
        // Xử lý lỗi
    }
    catch (err) {
        console.error("Error fetching credits:", err.response?.data || err.message);
        // trả về null nếu có lỗi
        return null;
    }
};
// Fetch schedule (thời khóa biểu)
export const fetchSchedule = async (userId
// thuộc tính schedule trong data có thể undefined nên dùng ? để tránh lỗi
// trả về mảng rỗng nếu undefined
// nên kiểu trả về của hàm là Promise<IScheduleItem[]>
) => {
    try {
        // dùng console log để debug xem userId có đúng không
        console.log("Fetching schedule for userId:", userId);
        // Gọi API để lấy thời khóa biểu
        const { data } = await axiosInstance.get(`/api/schedule/${userId}`);
        // Trả về thời khóa biểu hoặc mảng rỗng nếu không có
        return data.schedule ?? [];
    }
    catch (err) {
        // Xử lý lỗi
        console.error("Error fetching schedule:", err.response?.data || err.message);
        return [];
    }
};
// Fetch tuition (chi phí học tập)
export const fetchTuition = async (userId
// dùng kiểu trả về ITuition | null để dễ kiểm tra null khi có lỗi
) => {
    try {
        // id người dùng để debug nếu cần
        console.log("Fetching tuition for userId:", userId);
        // Gọi API để lấy chi phí học tập
        const { data } = await axiosInstance.get(`/api/tuition/${userId}`);
        return data;
    }
    catch (err) {
        // Xử lý lỗi
        // Xử lý lỗi và trả về null nếu có lỗi để dễ kiểm tra ở nơi gọi hàm này sau này (như trong component)
        console.error("Error fetching tuition:", err.response?.data || err.message);
        return null;
    }
};
