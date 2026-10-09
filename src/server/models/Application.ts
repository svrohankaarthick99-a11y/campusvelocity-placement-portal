import mongoose, { Document, Model, Schema } from 'mongoose';

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'REJECTED';

export interface IStatusHistoryItem {
  status: ApplicationStatus;
  remarks?: string;
  changedAt: Date;
  changedBy?: string;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  statusHistory: IStatusHistoryItem[];
  offerLetterRef?: string;
  interviewDate?: Date;
  interviewFormat?: string;
  interviewAttended?: boolean;
  attendedAt?: Date;
  interviewNotes?: string;
  interviewCodeSubmission?: string;
}

const statusHistorySchema = new Schema<IStatusHistoryItem>(
  {
    status: {
      type: String,
      enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: String,
      default: 'Placement System',
    },
  },
  { _id: false }
);

const applicationSchema = new Schema<IApplication>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
      default: 'APPLIED',
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    offerLetterRef: {
      type: String,
      default: '',
    },
    interviewDate: {
      type: Date,
    },
    interviewFormat: {
      type: String,
      default: 'Online Technical Round',
    },
    interviewAttended: {
      type: Boolean,
      default: false,
    },
    attendedAt: {
      type: Date,
    },
    interviewNotes: {
      type: String,
      default: '',
    },
    interviewCodeSubmission: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate applications
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

export const Application: Model<IApplication> =
  mongoose.models.Application || mongoose.model<IApplication>('Application', applicationSchema);
