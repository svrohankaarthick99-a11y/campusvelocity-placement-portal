import mongoose, { Document, Model, Schema } from 'mongoose';

export type JobApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  title: string;
  jobType: string;
  tier: string;
  stipendOrCTC: string;
  description: string;
  responsibilities: string[];
  location: string;
  minimumCGPA: number;
  allowedDepartments: string[];
  allowedGraduationYears: number[];
  requiredSkills: string[];
  openings: number;
  applicationDeadline: Date;
  assessmentDetails?: string;
  driveType?: string;
  approvalStatus: JobApprovalStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    jobType: {
      type: String,
      default: 'Full Time',
      trim: true,
    },
    tier: {
      type: String,
      default: 'Dream Tier',
      trim: true,
    },
    stipendOrCTC: {
      type: String,
      required: [true, 'Compensation / CTC is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: 'Pan India',
      trim: true,
    },
    minimumCGPA: {
      type: Number,
      required: [true, 'Minimum CGPA is required'],
      min: 0,
      max: 10,
    },
    allowedDepartments: {
      type: [String],
      required: [true, 'Allowed departments are required'],
      default: ['CSE', 'IT', 'ECE'],
    },
    allowedGraduationYears: {
      type: [Number],
      required: [true, 'Target graduation years are required'],
      default: [2026],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    openings: {
      type: Number,
      default: 5,
      min: 1,
    },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    assessmentDetails: {
      type: String,
      default: 'Online Technical Assessment + Technical Interviews',
    },
    driveType: {
      type: String,
      default: 'On-Campus Direct',
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CLOSED'],
      default: 'PENDING',
      required: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Job: Model<IJob> =
  mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema);
