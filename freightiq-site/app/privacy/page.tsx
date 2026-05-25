export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold">FreightIQ Privacy Policy</h1>

        <p className="text-slate-300">
          FreightIQ is an early-access application designed to help drivers share delivery
          information, stop details, and logistics intel.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <p className="text-slate-300">
            FreightIQ may collect account information such as email addresses, profile details, stop
            information, delivery notes, and uploaded photos submitted by users.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Location and Map Data</h2>
          <p className="text-slate-300">
            FreightIQ uses map and location services to help drivers navigate and view stop-related
            information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Camera and Photos</h2>
          <p className="text-slate-300">
            FreightIQ may request camera or photo library access so drivers can upload delivery zone
            photos, entrance photos, and related stop images.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Data Usage</h2>
          <p className="text-slate-300">
            Information submitted through FreightIQ is used to improve the app experience and help
            drivers share useful delivery intel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-slate-300">
            For questions about this privacy policy, contact: freightiqapp@protonmail.com
          </p>
        </section>

        <p className="pt-6 text-sm text-slate-500">Last updated: May 2026</p>
      </div>
    </main>
  );
}
