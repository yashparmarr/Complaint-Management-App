import mongoose from "mongoose";

// Complaint Schema (with validation & timestamps)
const ComplaintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
  },
  { timestamps: true } // Adds `createdAt` and `updatedAt`
);

// Create Model
const Complaint = mongoose.model("Complaint", ComplaintSchema);

// Static Methods
export default Complaint;

// Register a new complaint
export const registerComplaint = async (newComplaintData) => {
  try {
    const complaint = new Complaint(newComplaintData);
    await complaint.save();
    return complaint;
  } catch (error) {
    throw new Error(`Failed to register complaint: ${error.message}`);
  }
};

// Get all complaints
export const getAllComplaints = async () => {
  try {
    return await Complaint.find().sort({ createdAt: -1 }); // Newest first
  } catch (error) {
    throw new Error(`Failed to retrieve complaints: ${error.message}`);
  }
};
