// src/models/teacherModel.ts

import mongoose, { Schema, Document, Model } from "mongoose";
/*
  - import mongoose: thư viện ODM để làm việc với MongoDB.
  - Schema, Document, Model: kiểu/constructor dùng để khai báo schema, interface cho Document,
    và type cho model (giúp TypeScript hiểu kiểu dữ liệu).
*/

/* =======================
   INTERFACE: IAssignedClass
   =======================
   - Đây là kiểu TypeScript mô tả sub-document "assignedClass" (lớp mà giáo viên được gán).
   - Việc khai báo interface giúp TypeScript kiểm tra khi bạn gán/đọc assignedClass.
*/
export interface IAssignedClass {
  grade: string; // Khối lớp (VD: "10", "11")
  classLetter: string; // Tên lớp (VD: "A", "B")
  major: string; // Chuyên ngành hoặc tổ hợp môn (VD: "Toán")
  schoolYear: string; // Niên khóa (VD: "2024-2025")
  classCode: string; // Mã duy nhất của lớp (VD: "10A1-2024") => dùng để lookup
  className?: string; //
}

/* =======================
   INTERFACE: ITeacher
   =======================
   - Mô tả document Teacher trong MongoDB.
   - Kế thừa Document để chứa các field mặc định của Mongoose (ví dụ _id, save(), ...)
*/
export interface ITeacher extends Document {
  teacherId: string; // Mã giáo viên do hệ thống sinh (VD: "GV00001")
  name: string; // Họ tên
  dob?: Date; // Ngày sinh (tuỳ chọn)
  gender: "Nam" | "Nữ" | "other"; // Enum giới tính
  phone?: string; // SĐT
  address?: string; // Địa chỉ
  majors: string[]; // Các ngành đào tạo (mảng)
  subjectClasses: string[]; // Các lớp/môn đang dạy
  assignedClass?: IAssignedClass; // Thông tin lớp chủ nhiệm (là sub-document)
  assignedClassCode?: string; // Mã lớp chủ nhiệm (dùng cho index/unique nhanh)
  email?: string; // Email (unique nếu có)
  degree?: string; // Bằng cấp
  educationLevel?: string; // Trình độ học vấn
  certificates: string[]; // Chứng chỉ
  research?: string; // Công trình nghiên cứu
  subject: string[]; // Các môn giảng dạy
  avatar?: string; // URL ảnh đại diện
  createdAt?: Date; // Tự tạo do timestamps
  updatedAt?: Date; // Tự tạo do timestamps
}

/* =======================
   SCHEMA: AssignedClassSchema
   =======================
   - Đây là schema con cho assignedClass.
   - Mỗi field có kiểu và "required" để Mongoose validate khi lưu document.
   - Lưu ý: subdocument mặc định sẽ có _id riêng nếu không cấu hình _id:false.
*/
const AssignedClassSchema = new Schema<IAssignedClass>({
  grade: { type: String, required: true }, // bắt buộc: khối lớp
  classLetter: { type: String, required: true }, // bắt buộc: chữ lớp
  major: { type: String, required: true }, // bắt buộc: chuyên ngành
  schoolYear: { type: String, required: true }, // bắt buộc: niên khóa
  classCode: { type: String, required: true }, // bắt buộc: mã lớp (để lookup)
});

/* =======================
   SCHEMA: TeacherSchema
   =======================
   - Đây là schema chính cho collection "teachers".
   - Tên field trong schema phải khớp với interface ITeacher để TypeScript không báo lỗi.
   - { timestamps: true } tự động thêm 2 field: createdAt, updatedAt.
*/
const TeacherSchema = new Schema<ITeacher>(
  {
    // teacherId: mã do hệ thống sinh (unique)
    teacherId: { type: String, required: true, unique: true },
    // name: bắt buộc
    name: { type: String, required: true },
    // dob: tuỳ chọn
    dob: { type: Date },
    // gender: bắt buộc, chỉ cho phép 3 giá trị
    gender: { type: String, enum: ["Nam", "Nữ", "other"], required: true },
    phone: { type: String },
    address: { type: String },

    // Các mảng: cung cấp default [] để tránh null
    majors: { type: [String], default: [] }, // ngành đào tạo
    subjectClasses: { type: [String], default: [] }, // lớp/môn dạy

    // assignedClass: sub-document (schema con)
    // default: undefined => nếu không gán, trường này không xuất hiện trong doc
    assignedClass: { type: AssignedClassSchema, default: undefined },

    // assignedClassCode: dùng để tra cứu / index unique (một GV - một lớp)
    // unique: true -> cố gắng tạo index unique trên field này
    // sparse: true -> index chỉ áp dụng cho document có giá trị (không áp dụng cho null/absent)
    assignedClassCode: { type: String, unique: true, sparse: true },

    // email: unique, nhưng sparse để nhiều doc có null vẫn ok
    email: { type: String, unique: true, sparse: true },

    degree: { type: String },
    educationLevel: { type: String },

    // chứng chỉ mặc định mảng rỗng
    certificates: { type: [String], default: [] },

    research: { type: String },

    // subject: các môn giảng dạy
    subject: { type: [String], default: [] },

    avatar: { type: String },
  },
  { timestamps: true }, // Tự động: Mongoose thêm createdAt & updatedAt
);

/* =======================
   INDEX: unique có điều kiện cho assignedClass.classCode
   =======================
   Giải thích:
   - Mục tiêu: đảm bảo 1 giáo viên không bị gán cùng một classCode với người khác
     (hoặc đảm bảo 1 class chỉ có 1 chủ nhiệm).
   - partialFilterExpression: tốt hơn sparse cho các trường hợp phức tạp —
     chỉ tạo ràng buộc unique cho document thỏa điều kiện filter.
   - Cú pháp: index({ "assignedClass.classCode": 1 }, { unique: true, partialFilterExpression: { ... } })
*/
TeacherSchema.index(
  { "assignedClass.classCode": 1 }, // trường index (nested path)
  {
    unique: true, // index unique (nếu document match partialFilter)
    partialFilterExpression: {
      // chỉ áp dụng unique cho doc mà assignedClass.classCode tồn tại và khác null
      "assignedClass.classCode": { $exists: true, $ne: null },
    },
  },
);

/*
  NOTE:
  - partialFilterExpression vs sparse:
    * sparse: index sẽ bỏ qua các document có field null/absent nhưng có một số hành vi bất tiện.
    * partialFilterExpression cho phép filter tuỳ biến (ví dụ $ne: null).
  - Khi deploy production, kiểm tra setting autoIndex (production thường tắt autoIndex để tránh build index ở runtime).
*/

/* =======================
   PRE-save MIDDLEWARE
   TeacherSchema.pre("save", ...)
   =======================
   - Chạy trước khi document được lưu (save()).
   - Dùng để sinh teacherId tự động và cleanup assignedClass trống.
   - Lưu ý: nếu nhiều process cùng tạo teacher có thể bị race condition khi sinh teacherId —
     xem phần "Lưu ý / cải tiến" ở cuối.
*/
TeacherSchema.pre<ITeacher>("save", async function (next) {
  // 'this' là tài liệu ITeacher đang được lưu (document instance)
  // 1) Sinh teacherId nếu chưa có
  if (!this.teacherId) {
    // Lấy model hiện tại (không import để tránh circular dependency)
    const TeacherModel = mongoose.model<ITeacher>("Teacher");

    /* Tìm document có teacherId lớn nhất:
       - findOne({}, { teacherId: 1 }).sort({ teacherId: -1 })
       - .lean() trả về POJO (không phải Mongoose document) để tối ưu
    */
    const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
      .sort({ teacherId: -1 })
      .lean();

    // Nếu có teacher trước đó, tách số trong teacherId (GV00012 -> 12)
    const lastNumber = lastTeacher?.teacherId
      ? parseInt(lastTeacher.teacherId.replace("GV", ""), 10)
      : 0;

    // Tạo teacherId mới: "GV" + số tăng 1, pad left 5 chữ số => GV00013
    this.teacherId = "GV" + (lastNumber + 1).toString().padStart(5, "0");
  }

  // 2) Nếu assignedClass.classCode rỗng string thì bỏ luôn assignedClass để tránh lưu subdoc rỗng
  //    - .trim() để loại khoảng trắng
  //    - nếu rỗng => gán undefined (field sẽ không tồn tại trong document)
  if (this.assignedClass?.classCode?.trim() === "") {
    this.assignedClass = undefined;
    this.assignedClassCode = undefined;
  }

  // Tiếp tục quá trình lưu
  next();
});

/* =======================
   Tạo model và export
   =======================
   - mongoose.model<ITeacher>("Teacher", TeacherSchema):
     trả về model đã typed cho TypeScript.
   - Export default để import dễ dàng ở controller: import Teacher from "src/models/teacherModel";
*/
const TeacherModel: Model<ITeacher> = mongoose.model<ITeacher>(
  "Teacher",
  TeacherSchema,
);

export default TeacherModel;

/* =======================
   LƯU Ý & GỢI Ý (quan trọng)
   =======================
   1) Sinh teacherId hiện tại có race condition:
      - Nếu 2 request cùng chạy song song, cả 2 có thể lấy lastNumber giống nhau => tạo ID trùng.
      - Giải pháp an toàn:
         a) Dùng collection counters + findOneAndUpdate({ _id: "teacherId" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" })
            => atomic, safe, không trùng.
         b) Dùng transaction (session) + unique index để detect duplicate và retry.
      - Nếu dự án nhỏ, chấp nhận rủi ro tạm thời; nếu production, sửa bằng counters.

   2) Indexes:
      - Khi deploy, kiểm tra option autoIndex (production thường disable autoIndex để tránh build index on startup).
      - Nếu autoIndex = false, bạn phải tạo index thủ công (db.collection.createIndex(...)).

   3) assignedClass sub-document:
      - Hiện AssignedClassSchema không set {_id: false}, nên Mongoose sẽ tạo _id cho subdoc. Nếu không cần _id cho subdoc, bạn có thể thêm {_id: false} vào schema options.
      - assignedClassCode tồn tại cho phép lookup nhanh mà không cần truy vấn nested subdoc.

   4) sparse vs partialFilterExpression:
      - sparse: index không bao gồm tài liệu có field không tồn tại.
      - partialFilterExpression: linh hoạt hơn, nên dùng khi muốn filter phức tạp (ví dụ $ne: null).
*/
