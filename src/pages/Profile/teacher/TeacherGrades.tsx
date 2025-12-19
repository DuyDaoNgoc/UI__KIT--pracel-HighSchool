// TeacherGrades.tsx - Wrapper component for backward compatibility
// The actual implementation has been moved to GradeEntryFormPro.tsx with enhanced features

import React from "react";
import GradeEntryFormPro from "./GradeEntryFormSimple";

interface Props {
  classes?: any[];
  teacherId?: string;
}

export default function TeacherGrades({ classes = [], teacherId }: Props) {
  return <GradeEntryFormPro />;
}
