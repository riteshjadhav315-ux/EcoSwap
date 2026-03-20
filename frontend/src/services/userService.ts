import { apiFetch } from "./api";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  photoURL?: string;
  createdAt: any;
}

export async function createUserProfile(
  uid: string,
  profileData: Partial<UserProfile>
) {
  return apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify({ uid, ...profileData }),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    return await apiFetch(`/api/users/${uid}`);
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
) {
  return apiFetch(`/api/users/${uid}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function uploadProfilePicture(file: File, uid: string) {
  const formData = new FormData();
  formData.append("file", file);

  const data = await apiFetch<{ url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });

  await updateUserProfile(uid, { photoURL: data.url });

  return data.url;
}

export async function adminDeleteUser(uid: string, token: string) {
  return apiFetch(`/api/admin/users/${uid}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
