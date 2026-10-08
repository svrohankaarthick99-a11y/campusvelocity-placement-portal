import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  action: string;
  entityType: 'Company' | 'Job' | 'Application' | 'Student';
  entityId: string;
  entityTitle: string;
  remarks: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: ['Company', 'Job', 'Application', 'Student'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    entityTitle: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
