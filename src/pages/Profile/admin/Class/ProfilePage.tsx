interface ClassesTabProps {
  refreshTrigger?: boolean; // 🔄 nhận từ bên ngoài
}

export default function ClassesTab({ refreshTrigger }: ClassesTabProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [openClassKey, setOpenClassKey] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/classes");
        if (res.data && Array.isArray(res.data.data)) {
          const mapped: ClassData[] = res.data.data.map((cls: any) => ({
            classCode: cls.classCode,
            teacherName: cls.teacherName || "",
            students:
              cls.studentIds?.map((s: any) => ({
                _id: s._id || s,
                studentId: s.studentId,
                name: s.name,
                dob: s.dob,
                gender: s.gender,
                address: s.address,
                residence: s.residence,
                grade: cls.grade,
                classLetter: cls.classLetter,
                major: cls.major,
                classCode: cls.classCode,
                teacherName: cls.teacherName || "",
              })) || [],
          }));
          setClasses(mapped);
        } else setClasses([]);
      } catch (err) {
        console.error("⚠️ fetch classes error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [refreshTrigger]); // 🔄 trigger khi gán teacher xong

  // ... rest code giữ nguyên
}
