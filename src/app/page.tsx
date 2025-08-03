export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center">
          Vercel RAG Configurator
        </h1>
      </div>

      <div className="relative flex place-items-center">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-semibold">
            Visual RAG Pipeline Builder
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Design, configure, evaluate, and export RAG pipelines through an intuitive interface.
          </p>
        </div>
      </div>
    </main>
  )
}