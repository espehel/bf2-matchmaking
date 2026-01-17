import AuthButton from '@/components/AuthButton';

interface Props {
  text: string;
}

export async function NotSignedInCard({ text }: Props) {
  return (
    <div className="card bg-base-200 shadow-md border border-base-300 animate-slide-up">
      <div className="card-body">
        <div className="flex flex-col items-center justify-center gap-4 py-8 px-8">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-base-content/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-base-content/70">{text}</p>
          <AuthButton className="btn btn-primary btn-outline" user={null} />
        </div>
      </div>
    </div>
  );
}
