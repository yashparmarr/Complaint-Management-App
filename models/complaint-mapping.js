import mongoose from "mongoose";

// Define Schema with enhanced validation
const ComplaintMappingSchema = new mongoose.Schema(
  {
    complaintID: {
      type: String,
      required: [true, "Complaint ID is required"],
      trim: true,
    },
    engineerName: {
      type: String,
      required: [true, "Engineer name is required"],
      trim: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Create Model
const ComplaintMapping = mongoose.model(
  "ComplaintMapping",
  ComplaintMappingSchema
);

// ===== Helper Methods =====

/**
 * Register a new complaint-engineer mapping
 * @param {Object} mappingData - Should contain complaintID and engineerName
 * @returns {Promise<ComplaintMapping>} The saved mapping document
 */
export const createMapping = async (mappingData) => {
  try {
    const mapping = new ComplaintMapping(mappingData);
    return await mapping.save();
  } catch (error) {
    throw new Error(`Failed to create mapping: ${error.message}`);
  }
};

/**
 * Find mappings by engineer name
 * @param {String} engineerName
 * @returns {Promise<Array>} List of mappings
 */
export const findMappingsByEngineer = async (engineerName) => {
  try {
    return await ComplaintMapping.find({ engineerName }).sort({
      createdAt: -1,
    });
  } catch (error) {
    throw new Error(`Failed to find mappings: ${error.message}`);
  }
};

export default ComplaintMapping;
