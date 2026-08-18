import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { signUp } from "../api";

interface Props {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function SignUpButton({ onSuccess, onError }: Props) {
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        onError?.("Missing Google credential");
        return;
      }
      const data = await signUp(credentialResponse.credential);
      onSuccess?.(data);
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.("Google login failed")}
      text="signup_with"
    />
  );
}