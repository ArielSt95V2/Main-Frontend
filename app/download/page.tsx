import type { Metadata } from "next";

const INSTALLER_URL =
  "https://space.tesseriver.com/releases/Tesseriver-App-Setup-latest.exe";

const BETA_INSTALLER_URL =
  "https://space.tesseriver.com/releases/Tesseriver-App-Setup-beta.exe";

export const metadata: Metadata = {
  title: "Download Tesseriver App",
  description: "Download the Tesseriver desktop app for Windows",
};

export default function DownloadPage() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Download Tesseriver App
        </h1>
        <p className="mt-4 text-gray-600">
          Windows desktop app. Pair with your account to control your device
          from the web dashboard.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={INSTALLER_URL}
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Download for Windows (64-bit)
          </a>
          <a
            href={BETA_INSTALLER_URL}
            className="inline-block rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Download beta build (for testing)
          </a>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900">
            How to install and pair
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-gray-700">
            <li>
              Create an account or{" "}
              <a href="/auth/login" className="text-indigo-600 underline">
                log in
              </a>{" "}
              at tesseriver.com.
            </li>
            <li>
              Open{" "}
              <a href="/dashboard" className="text-indigo-600 underline">
                Dashboard
              </a>{" "}
              → generate a pairing code.
            </li>
            <li>Download and run the installer above.</li>
            <li>
              In the app: Settings → Platform connection → paste the code → Pair
              device.
            </li>
            <li>On the dashboard, confirm the device appears and try Ping.</li>
          </ol>
        </section>

        <section className="mt-10 rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900">
            Windows SmartScreen (unsigned installer)
          </h2>
          <p className="mt-2 text-sm text-amber-800">
            The app is not code-signed yet. Windows may show &quot;Unknown
            publisher&quot;. Click <strong>More info</strong> →{" "}
            <strong>Run anyway</strong>. The app is safe to install.
          </p>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          Requires Windows 10 or 11 (64-bit).
        </p>
      </div>
    </main>
  );
}
