const API_URL = "https://ecoswap-backend-ows2.onrender.com/api";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  photoURL?: string;
  createdAt: any;
}

export async function createUserProfile(uid: string, profileData: Partial<UserProfile>) {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, ...profileData }),
  });
  if (!response.ok) throw new Error("Failed to create user profile");
  return await response.json();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const response = await fetch(`${API_URL}/users/${uid}`);
  if (!response.ok) return null;
  return await response.json();
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const response = await fetch(`${API_URL}/users/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update user profile");
  return await response.json();
}

export async function uploadProfilePicture(file: File, uid: string) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to upload profile picture");
  const data = await response.json();
  
  // Update profile with new photo URL
  await updateUserProfile(uid, { photoURL: data.url });
  
  return data.url;
}

export async function adminDeleteUser(uid: string, token: string) {
  const response = await fetch(`${API_URL}/admin/users/${uid}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete user");
  return await response.json();
}
