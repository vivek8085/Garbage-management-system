import express from "express";
import multer from "multer";
import path from "path";
import Report from "../models/Report.js";

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "backend", "uploads"));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage });

// Create a new report (accepts optional image)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { location, description, reporterName, reporterContact } = req.body;
    if (!location) return res.status(400).json({ message: "Location is required" });
    if (!reporterName || !String(reporterName).trim()) return res.status(400).json({ message: "Reporter name is required" });
    if (!reporterContact || !String(reporterContact).trim()) return res.status(400).json({ message: "Reporter contact (phone or email) is required" });
    const reportData = { location, description, reporterName, reporterContact };
    if (req.file) {
      // Store a public URL path to the uploaded file
      reportData.image = `/uploads/${req.file.filename}`;
    }
    const report = new Report(reportData);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create report" });
  }
});

// List reports (all)
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get reports" });
  }
});

// Resolve a report (municipality action)
router.put("/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    report.status = "resolved";
    report.resolvedBy = resolvedBy || "municipality";
    report.resolvedAt = new Date();
    await report.save();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resolve report" });
  }
});

// User raises a dispute against a resolved report
router.post("/:id/dispute", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { raisedBy, reason } = req.body;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const dispute = {
      raisedBy: raisedBy || "anonymous",
      reason: reason || "",
      status: "open",
      createdAt: new Date(),
    };
    if (req.file) {
      dispute.image = `/uploads/${req.file.filename}`;
    }

    // push dispute and mark report as disputed
    report.disputes = report.disputes || [];
    report.disputes.push(dispute);
    report.status = "disputed";
    await report.save();

    res.status(201).json({ message: "Dispute raised", dispute });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to raise dispute" });
  }
});

export default router;
