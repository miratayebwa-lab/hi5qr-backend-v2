import Image from "next/image";

const BRAND_NAVY = "#0c1a2b";
const BRAND_ORANGE = "#de8a02";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur"
        style={{ WebkitBackdropFilter: "blur(10px)" }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            {/* If you have a logo file, replace src with "/hi5-logo.png" etc */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: BRAND_NAVY }}
              aria-label="HI5"
              title="HI5"
            >
              <span className="text-sm font-bold">HI5</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
                HI5
              </div>
              <div className="text-xs text-zinc-500">QR sharing made simple</div>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-zinc-700 hover:text-zinc-950">
              Features
            </a>
            <a href="#how" className="text-zinc-700 hover:text-zinc-950">
              How it works
            </a>
            <a href="#privacy" className="text-zinc-700 hover:text-zinc-950">
              Privacy
            </a>
            <a
              href="#get"
              className="rounded-full px-4 py-2 font-semibold text-white"
              style={{ background: BRAND_ORANGE }}
            >
              Get HI5
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-5xl px-5 py-14">
        <section className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm md:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: `${BRAND_ORANGE}1a`, color: BRAND_ORANGE }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: BRAND_ORANGE }}
                />
                Mode 1 + Mode 2 supported
              </div>

              <h1
                className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl"
                style={{ color: BRAND_NAVY }}
              >
                Share contacts and files instantly with a QR code
              </h1>

              <p className="mt-4 text-lg leading-8 text-zinc-600">
                HI5 is a quick QR sharing app: create a QR, show it on your screen, and let someone
                scan to receive your contact card or open shared content
              </p>

              <div id="get" className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                  style={{ background: BRAND_NAVY }}
                >
                  Coming soon on Google Play
                </a>

                <a
                  href="#privacy"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                >
                  View privacy policy
                </a>
              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Tip: Your HI5 Mode 2 viewer page is available at <b>hi5qr.com/m/&lt;qrId&gt;</b>.
              </p>
            </div>

            <div className="rounded-3xl border border-black/5 bg-zinc-50 p-6">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
                      Mode 1 — Contact Card
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: `${BRAND_ORANGE}1a`, color: BRAND_ORANGE }}
                    >
                      QR
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Generate a QR with your chosen contact fields (name, phone, email, company,
                    social links, photo). Receiver scans and saves instantly
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
                      Mode 2 — File / Text Share
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: `${BRAND_ORANGE}1a`, color: BRAND_ORANGE }}
                    >
                      Upload + Viewer
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Share text directly in the QR. For files (PDF, image, audio, video, docs), HI5
                    uploads securely and generates a QR that opens a viewer page
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
                    Simple. Fast. No talking required.
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    Perfect for networking events, businesses, customer support, and quick sharing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
            Features
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Contact QR (Mode 1)"
              text="Create and share a digital contact card via QR. Receiver scans and saves."
            />
            <FeatureCard
              title="File & Text QR (Mode 2)"
              text="Text embeds directly inside QR. Files open via a secure HI5 viewer page."
            />
            <FeatureCard
              title="Works on phones"
              text="Scan and open the shared content instantly in the browser."
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
            How it works
          </h2>

          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <StepCard n="1" title="Create" text="Pick Mode 1 (contact) or Mode 2 (text/file)." />
            <StepCard
              n="2"
              title="Show QR"
              text="Your phone displays the QR on-screen for someone to scan."
            />
            <StepCard
              n="3"
              title="Receive"
              text="They scan and instantly get your contact or open the viewer page."
            />
          </ol>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="mt-16 scroll-mt-24">
          <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm md:p-12">
            <h2 className="text-2xl font-bold" style={{ color: BRAND_NAVY }}>
              Privacy Policy
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Effective date: <b>{new Date().toISOString().slice(0, 10)}</b>
            </p>

            <div className="prose prose-zinc mt-6 max-w-none">
              <p>
                This Privacy Policy explains how HI5 (“we”, “us”, “our”) collects, uses, and shares
                information when you use the HI5 mobile app and the HI5 web viewer at hi5qr.com
                (together, the “Service”).
              </p>

              <h3>1. What HI5 does</h3>
              <p>
                HI5 helps you create QR codes to share (a) contact information (Mode 1) and (b)
                content such as text or files (Mode 2). When someone scans a Mode 2 QR, they may be
                directed to a viewer page on hi5qr.com to open the content.
              </p>

              <h3>2. Information you provide</h3>
              <ul>
                <li>
                  <b>Contact data (Mode 1):</b> Information you choose to include in your QR contact
                  card (e.g., name, phone, email, company, social links, photo).
                </li>
                <li>
                  <b>Content (Mode 2):</b> Text you enter, or files you choose to upload (PDF, image,
                  audio, video, documents).
                </li>
              </ul>

              <h3>3. Information collected automatically</h3>
              <ul>
                <li>
                  <b>Basic usage data:</b> We may collect minimal technical data necessary to operate
                  the Service (e.g., request logs, timestamps, and basic device/browser information
                  when opening viewer pages).
                </li>
                <li>
                  <b>No selling of personal data:</b> We do not sell your personal data.
                </li>
              </ul>

              <h3>4. How we use information</h3>
              <ul>
                <li>To generate QR codes and display shared content.</li>
                <li>To upload and retrieve files you request in Mode 2.</li>
                <li>To maintain security, prevent abuse, and improve reliability.</li>
              </ul>

              <h3>5. How Mode 2 file sharing works</h3>
              <p>
                For Mode 2 file sharing, files are stored in our storage provider. The QR points to a
                viewer page which may generate time-limited links to access the file. Anyone with the
                QR (or viewer link) may be able to access the content.
              </p>

              <h3>6. Sharing and disclosure</h3>
              <p>
                We may share information with service providers that help us operate the Service
                (e.g., hosting and storage). We may also disclose information if required by law or
                to protect rights, safety, and security.
              </p>

              <h3>7. Data retention</h3>
              <p>
                We retain information only as long as necessary to provide the Service and for
                legitimate business purposes such as security and compliance, unless a longer period
                is required by law.
              </p>

              <h3>8. Security</h3>
              <p>
                We use reasonable administrative, technical, and organizational measures to protect
                information. However, no system can be 100% secure.
              </p>

              <h3>9. Children’s privacy</h3>
              <p>
                The Service is not directed to children under 13 (or the minimum age required in
                your country). We do not knowingly collect personal data from children.
              </p>

              <h3>10. Your choices</h3>
              <ul>
                <li>
                  You control what you include in contact QRs and what you upload/share in Mode 2.
                </li>
                <li>
                  If you do not want to share certain information, do not include it in a QR code.
                </li>
              </ul>

              <h3>11. Contact</h3>
              <p>
                If you have questions about this Privacy Policy, contact us at:{" "}
                <b>support@hi5qr.com</b> (replace with your real email if different).
              </p>

              <p className="mt-6 text-xs text-zinc-500">
                Developed by <b>MIRA</b>.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-12 pb-10 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} HI5. Developed by MIRA.
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  );
}

function StepCard({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <li className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: BRAND_ORANGE }}
        >
          {n}
        </div>
        <div className="text-sm font-semibold" style={{ color: BRAND_NAVY }}>
          {title}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{text}</p>
    </li>
  );
}