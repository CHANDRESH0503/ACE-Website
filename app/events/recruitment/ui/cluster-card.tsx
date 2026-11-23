import Image from "next/image";
import Link from "next/link";

interface ClusterCardProps {
  title: string;
  imageUrl: string;
  applyLink: string;
}

export function ClusterCard({ title, imageUrl, applyLink }: ClusterCardProps) {
  return (
    <Link
      href={applyLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Apply for ${title} (opens in a new tab)`}
      className="group flex items-center gap-4 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10 transition-colors duration-200 hover:bg-[#F5D547] hover:ring-transparent focus-visible:bg-[#F5D547] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-5 sm:px-5 sm:py-4"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/10 sm:h-16 sm:w-16">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="64px"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <h2 className="min-w-0 flex-1 text-xl font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-[#07152A] group-focus-visible:text-[#07152A] sm:text-2xl">
        {title}
      </h2>

      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#3B6CFF] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-[#07152A] group-hover:text-[#F5D547] group-focus-visible:bg-[#07152A] group-focus-visible:text-[#F5D547]">
        Apply
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 11l6-6M6 5h5v5" />
        </svg>
      </span>
    </Link>
  );
}