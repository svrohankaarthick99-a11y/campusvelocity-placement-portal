import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registrationNumber: string;
  branch: string;
  cgpa: number;
  graduationYear: number;
  resumeLink?: string;
  phone?: string;
  skills: string[];
  portfolioLink?: string;
  githubLink?: string;
  linkedinLink?: string;
  avatarUrl?: string;
  placementTierStatus?: string;
  hasActiveBacklogs: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration / Roll Number is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Department / Branch is required'],
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation Year is required'],
    },
    resumeLink: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolioLink: {
      type: String,
      default: '',
      trim: true,
    },
    githubLink: {
      type: String,
      default: '',
      trim: true,
    },
    linkedinLink: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEZOcJZDPlRhiGZPDEf1dzgKXV8XMIWMbN3aXvnhEPUIbLnlp2oCMD-WX4d4D8bcI0TqqaVJzvWR3pN1poA0qf8PtHh6nbyBgv8TPHoBpujmQKveIG2IdcakFurZH6XdjgxjQRRMIgD5sUIVtY39acPGA7xIJPq2XeQ9leU4FaBcwVGkUFoeiZITgwT00et59hTmfmcBNn6mX_qNLGWvZRuMi2gRIKFqLvcoZJ1QQ',
    },
    placementTierStatus: {
      type: String,
      default: 'Tier-1 Dream Eligible (No Active Backlogs)',
    },
    hasActiveBacklogs: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile || mongoose.model<IStudentProfile>('StudentProfile', studentProfileSchema);
