"use client";

import { API_URL } from "@/lib/api";
import Image from "next/image";
import { Button } from "../ui/button";

function signInWithGoogle() {
  window.location.href = `${API_URL}/auth/google`;
}

export const SocialMediaButtons = () => {
  return (
    <div className="flex flex-col gap-4 px-4 my-4">
      {/* <Button
                variant="ghost"
                className="w-full flex items-center gap-2"
                type="button"
                // onClick={signInWithGitHub}
            >
                <Image
                    src="/providers/github.svg"
                    priority
                    width={20}
                    height={20}
                    alt="Github"
                />
                Continue with Github
            </Button> */}
      <Button
        variant="ghost"
        className="w-full flex items-center gap-2"
        type="button"
        onClick={signInWithGoogle}
      >
        <Image src="/providers/google.svg" width={20} priority height={20} alt="Google" />
        Continue with Google
      </Button>
    </div>
  );
};
