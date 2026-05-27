import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#166534] flex items-center justify-center">
              <span className="text-white text-2xl font-bold tracking-[-1.5px]">CT</span>
            </div>
            <span className="text-3xl font-bold tracking-[-1.5px] text-[#1F2525]">CragTrails</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1F2525]">Join the community</h1>
          <p className="text-[#5C6666] mt-2">Create an account to log your sends and explore the crags</p>
        </div>

        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border border-[#E5E2D9] rounded-3xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-[#E5E2D9] hover:bg-[#F8F7F4] rounded-2xl",
              formButtonPrimary: "bg-[#166534] hover:bg-[#14532D] text-white rounded-2xl",
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />

        <p className="text-center text-xs text-[#8A908A] mt-6">
          By creating an account, you agree to our community guidelines and trust & safety policies.
        </p>
      </div>
    </div>
  );
}
