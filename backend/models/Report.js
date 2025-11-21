import mongoose from "mongoose";

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    location: {
      // simple text description or address; could be extended to geo coordinates
      type: String,
      required: true,
    },
    description: { type: String },
    reporterName: { type: String, required: true },
    reporterContact: { type: String, required: true },
    // include 'disputed' as a status when users raise disputes
    status: { type: String, enum: ["reported", "resolved", "disputed"], default: "reported" },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    image: { type: String },
    disputes: [
      {
        raisedBy: { type: String },
        reason: { type: String },
        image: { type: String },
        status: { type: String, enum: ["open", "reviewed", "rejected"], default: "open" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
