import api from "@lib/api";

export const signOut = async (refresh: string) => {
    await api.post('/auth/google/sign-out/', { refresh });
};
