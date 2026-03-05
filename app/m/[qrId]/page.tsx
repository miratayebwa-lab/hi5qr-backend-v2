import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Props = {
  params: { qrId: string };
};

export default async function Mode2ViewerPage({ params }: Props) {
  const qrId = params.qrId;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  const columns = "id, mode, type, status, mime_type, storage_bucket, storage_path, created_at";

  const tryCols = ["id", "qr_id", "public_id", "code", "slug"] as const;

  let data: any = null;

  for (const col of tryCols) {
    const { data: row, error } = await supabase
      .from("qr_items")
      .select(columns)
      .eq(col, qrId)
      .maybeSingle();

    if (!error && row) {
      data = row;
      break;
    }
  }

  if (!data) return notFound();

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>HI5 Viewer</h1>

      <div style={{ opacity: 0.85, marginBottom: 16 }}>
        <div><b>QR ID:</b> {data.id}</div>
        <div><b>Mode:</b> {data.mode}</div>
        <div><b>Type:</b> {data.type}</div>
        <div><b>Status:</b> {data.status}</div>
        <div><b>MIME:</b> {data.mime_type}</div>
        <div><b>Bucket:</b> {data.storage_bucket}</div>
        <div><b>Path:</b> {data.storage_path}</div>
      </div>

      <p style={{ marginTop: 16 }}>
        ✅ If you can see this page, your <code>/m/[qrId]</code> route is deployed correctly.
      </p>

      <p style={{ opacity: 0.7 }}>
        Next step: render / download the actual file from Supabase using bucket + path.
      </p>
    </main>
  );
}