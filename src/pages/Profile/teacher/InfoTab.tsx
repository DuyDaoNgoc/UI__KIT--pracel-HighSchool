import React from "react";
import { IUserProfile } from "../../../types/profiles";
import TeacherProfileInfo from "./TeacherProfileInfo";

interface Props {
  user: IUserProfile;
}

export default function TeacherInfo({ user }: Props) {
  return <TeacherProfileInfo user={user} />;
}
