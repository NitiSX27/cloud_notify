import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { ticketsApi, uploadsApi } from "../../lib/api";
import { Upload, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Road & Infrastructure",
  "Water & Drainage",
  "Electricity",
  "Garbage & Waste",
  "Parks & Recreation",
  "Noise Complaint",
  "Public Safety",
  "Street Lighting",
  "Tree & Environment",
  "Other",
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    locationText: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 3) errs.title = "Title must be at least 3 characters";
    if (!form.description.trim() || form.description.length < 10) errs.description = "Description must be at least 10 characters";
    if (!form.category) errs.category = "Please select a category";
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (imageFile) {
        setUploading(true);
        try {
          const presignRes = await uploadsApi.presign(imageFile.type, "tickets");
          const { uploadUrl, publicUrl } = presignRes.data;
          await fetch(uploadUrl, {
            method: "PUT",
            body: imageFile,
            headers: { "Content-Type": imageFile.type },
          });
          imageUrl = publicUrl;
        } catch {
          toast.error("Image upload failed, submitting without image");
        } finally {
          setUploading(false);
        }
      }

      const ticket = await ticketsApi.create({
        ...form,
        imageUrl,
      });

      toast.success("Request submitted successfully!");
      navigate(`/tickets/${ticket.data.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to submit request";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="New Request">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Submit a Request</h1>
            <p className="page-subtitle">Report an issue or request a community service</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} id="create-ticket-form">
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-title">Request Title *</label>
              <input
                id="ticket-title"
                type="text"
                className="form-input"
                placeholder="Brief description of the issue..."
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && <span className="form-error"><AlertCircle size={12} style={{ display: "inline", marginRight: 4 }} />{errors.title}</span>}
            </div>

            {/* Category & Priority */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="ticket-category">Category *</label>
                <select
                  id="ticket-category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <span className="form-error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ticket-priority">Priority</label>
                <select
                  id="ticket-priority"
                  className="form-select"
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-description">Description *</label>
              <textarea
                id="ticket-description"
                className="form-textarea"
                placeholder="Provide detailed information about the issue, when it started, how it affects the community..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                style={{ minHeight: 130 }}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-location">
                <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                Location (optional)
              </label>
              <input
                id="ticket-location"
                type="text"
                className="form-input"
                placeholder="Street address or landmark..."
                value={form.locationText}
                onChange={(e) => set("locationText", e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Photo Evidence (optional)</label>
              <div
                id="upload-area"
                className={`upload-area ${imageFile ? "" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); }}
                onDragLeave={(e) => e.currentTarget.classList.remove("dragover")}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("dragover");
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="upload-preview" />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--emerald)", fontSize: 13 }}>
                      <CheckCircle size={14} /> Image selected: {imageFile?.name}
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={28} style={{ color: "var(--text-muted)" }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                      Drop image here or click to browse
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      PNG, JPG, WEBP up to 10MB
                    </div>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                id="cancel-create"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-ticket"
                className="btn btn-primary"
                disabled={submitting || uploading}
              >
                {submitting ? (
                  <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                ) : null}
                {uploading ? "Uploading image..." : submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
