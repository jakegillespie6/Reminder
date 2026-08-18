import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { signIn } from "../api";

interface Props {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function SignInButton({ onSuccess, onError }: Props) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        onError?.("Missing Google credential");
        return;
      }
      const data = await signIn(credentialResponse.credential);
      onSuccess?.(data);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.("Google login failed")}
    />
  );
}