import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSetting extends Document {
  key: string;
  value: any;
}

const SystemSettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

const SystemSetting = mongoose.model<ISystemSetting>(
  "SystemSetting",
  SystemSettingSchema,
);

export default SystemSetting;
