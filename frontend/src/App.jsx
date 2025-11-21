import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState({});
  const [disputeReason, setDisputeReason] = useState({});
  const [disputeImage, setDisputeImage] = useState({});

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      // don't alert repeatedly
    } finally {
      setLoading(false);
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!location) return alert("Please enter a location or address");
    if (!reporterName || !reporterName.trim()) return alert("Please enter your name");
    if (!reporterContact || !reporterContact.trim()) return alert("Please enter your phone number or email");

    const form = new FormData();
    form.append("location", location);
    form.append("description", description);
    form.append("reporterName", reporterName);
    form.append("reporterContact", reporterContact);
    if (imageFile) form.append("image", imageFile);

    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Failed to submit report");
      setLocation("");
      setDescription("");
      setReporterName("");
      setReporterContact("");
      setImageFile(null);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    }
  }

  async function resolveReport(id) {
    const resolvedBy = window.prompt("Enter name of resolver (optional)") || "municipality";
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy }),
      });
      if (!res.ok) throw new Error("Failed to resolve report");
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Garbage Reporting</h1>

      <form onSubmit={submitReport} className="bg-white p-4 rounded shadow mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Location / Address</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full p-2 border rounded"
            placeholder="e.g. Corner of Main St and 3rd Ave"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full p-2 border rounded"
            placeholder="optional details"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="Your name"
            required
            aria-required="true"
            className="p-2 border rounded"
          />
          <input
            value={reporterContact}
            onChange={(e) => setReporterContact(e.target.value)}
            placeholder="Phone or email"
            required
            aria-required="true"
            className="p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files && e.target.files[0])}
            className="mt-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit Report</button>
          <button type="button" onClick={() => { setLocation(""); setDescription(""); setReporterName(""); setReporterContact(""); setImageFile(null); }} className="px-3 py-2 border rounded">Clear</button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-medium mb-3">Reports</h2>
        {loading ? (
          <div>Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-gray-600">No reports yet.</div>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r._id} className="bg-white p-4 rounded shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <strong className="text-lg">{r.location}</strong>
                    <div className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {r.image ? (
                  <div className="mt-3">
                    <img src={`${API_BASE}${r.image}`} alt="report" className="w-full max-h-64 object-cover rounded" />
                  </div>
                ) : null}

                {r.description ? <div className="mt-3">{r.description}</div> : null}

                <div className="mt-3 text-sm text-gray-600">Reporter: {r.reporterName || "anonymous"} {r.reporterContact ? `(${r.reporterContact})` : ""}</div>

                <div className="mt-3">
                  <span className="font-medium">Status:</span> <span className={r.status === 'resolved' ? 'text-green-600' : 'text-yellow-600'}>{r.status}</span>
                  {r.status === "resolved" && r.resolvedAt ? (
                    <span className="ml-2 text-sm text-gray-500">• Resolved by {r.resolvedBy} on {new Date(r.resolvedAt).toLocaleString()}</span>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {r.status === "reported" ? (
                    <button onClick={() => resolveReport(r._id)} className="px-3 py-1 bg-green-600 text-white rounded">Mark Resolved</button>
                  ) : null}

                  {r.status === "resolved" || r.status === "disputed" ? (
                    <>
                      <button onClick={() => setDisputeOpen(prev => ({ ...prev, [r._id]: !prev[r._id] }))} className="px-3 py-1 bg-red-600 text-white rounded">Raise Dispute</button>
                      {r.disputes && r.disputes.length > 0 ? (
                        <span className="text-sm text-gray-500">{r.disputes.length} dispute(s)</span>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {disputeOpen[r._id] ? (
                  <form className="mt-3 bg-gray-50 p-3 rounded" onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData();
                    form.append('raisedBy', 'user');
                    form.append('reason', disputeReason[r._id] || '');
                    if (disputeImage[r._id]) form.append('image', disputeImage[r._id]);
                    try {
                      const res = await fetch(`${API_BASE}/api/reports/${r._id}/dispute`, { method: 'POST', body: form });
                      if (!res.ok) throw new Error('Failed to raise dispute');
                      setDisputeOpen(prev => ({ ...prev, [r._id]: false }));
                      setDisputeReason(prev => ({ ...prev, [r._id]: '' }));
                      setDisputeImage(prev => ({ ...prev, [r._id]: null }));
                      fetchReports();
                    } catch (err) {
                      console.error(err);
                      alert('Failed to raise dispute');
                    }
                  }}>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Why is this not resolved?</label>
                      <textarea value={disputeReason[r._id] || ''} onChange={(e) => setDisputeReason(prev => ({ ...prev, [r._id]: e.target.value }))} className="mt-1 block w-full p-2 border rounded" />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Photo (optional)</label>
                      <input type="file" accept="image/*" onChange={(e) => setDisputeImage(prev => ({ ...prev, [r._id]: e.target.files && e.target.files[0] }))} className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 bg-red-600 text-white rounded">Submit Dispute</button>
                      <button type="button" onClick={() => setDisputeOpen(prev => ({ ...prev, [r._id]: false }))} className="px-3 py-1 border rounded">Cancel</button>
                    </div>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
