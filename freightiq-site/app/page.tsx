export default function FreightIQLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                Built for real deliveries
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">FreightIQ</h1>
              <p className="mt-4 text-xl font-medium text-slate-700 md:text-2xl">
                Simple, fast maps + real driver intel.
              </p>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                FreightIQ helps drivers find stops fast, understand them quickly, and avoid bad
                surprises like construction, tight access, or temporary delivery issues.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#how-it-works"
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  See how it works
                </a>
                <a
                  href="#mission"
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Why FreightIQ exists
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-500">Driver problem</div>
                <div className="mt-2 text-lg font-semibold">
                  The map gets you close. It does not tell you how the delivery actually goes.
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  FreightIQ fills that gap with practical intel from drivers: where to unload, what
                  changed recently, and what can screw up the stop today.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-500">What matters</div>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                  <li>• Fast search and map flow</li>
                  <li>• Delivery zone clarity</li>
                  <li>• Real driver notes</li>
                  <li>• Fresh, recent intel you can trust</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Why FreightIQ exists</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Generic maps can get a driver to the address. They usually cannot tell the driver what
              happens when they actually get there.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              FreightIQ is being built to close that gap with simple, trustworthy delivery intel
              from people who have actually been there.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold">The north star</h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              FreightIQ should feel simple, fast, and reliable, while adding the real-world driver
              intel that standard map apps are missing.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-500">01</div>
              <h3 className="mt-3 text-xl font-semibold">Find the stop fast</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Search by address or place and jump right to the stop without extra clutter or
                guesswork.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-500">02</div>
              <h3 className="mt-3 text-xl font-semibold">See the delivery zone</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Drivers can set the actual delivery zone so the next driver knows where the stop
                really happens.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-500">03</div>
              <h3 className="mt-3 text-xl font-semibold">Read fresh driver intel</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Notes and recent updates help drivers avoid delays, construction issues, weather
                problems, and other temporary headaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold">For drivers</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Get there faster</li>
              <li>• Understand the stop quicker</li>
              <li>• Avoid getting trapped by bad conditions</li>
              <li>• Share intel that actually helps the next driver</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 p-6">
            <h3 className="text-xl font-semibold">Current focus</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Bulletproof map flow</li>
              <li>• Clean search experience</li>
              <li>• Clear stop intel</li>
              <li>• Simple, no BS usability</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">FreightIQ</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Built to help drivers move faster, avoid surprises, and make deliveries smoother
                with real-world intel that normal map apps do not give you.
              </p>
            </div>
            <div className="md:text-right">
              <a
                href="mailto:freightiqapp@proton.me?subject=FreightIQ Early Access&body=Hey FreightIQ team,%0D%0A%0D%0AI’d like early access to FreightIQ.%0D%0A%0D%0ADevice: iPhone / Android%0D%0APhone model:%0D%0AType of driving: local / LTL / food service / flatbed / other%0D%0AAnything specific you'd like help with?%0D%0A%0D%0AThanks!"
                className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90"
              >
                Request Early Access
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
