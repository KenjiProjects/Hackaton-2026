import Image from "next/image";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
    >
      <Image
        src="/dalan-mark.svg"
        alt=""
        width={64}
        height={64}
        priority
      />
      <div className="text-center">
        <p className="text-xl font-semibold tracking-[0.2em]">DALAN</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Getting things ready
        </p>
      </div>
      <span
        aria-hidden="true"
        className="mt-2 size-6 animate-spin rounded-full border-2 border-teal-700/20 border-t-teal-700 motion-reduce:animate-none dark:border-teal-300/20 dark:border-t-teal-300"
      />
    </main>
  );
}
