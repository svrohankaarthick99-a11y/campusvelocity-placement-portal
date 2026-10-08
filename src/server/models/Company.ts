import mongoose, { Document, Model, Schema } from 'mongoose';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  companyName: string;
  logo: string;
  description: string;
  website: string;
  industry: string;
  location: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: 'Technology / Software',
      trim: true,
    },
    location: {
      type: String,
      default: 'India',
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: '',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
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

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>('Company', companySchema);
