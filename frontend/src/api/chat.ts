import axios from 'axios';
import { getAuth } from "firebase/auth";
import { API_BASE_URL as BASE_URL } from './config';

export type ChatPayload = {
  question: string;
  file_id?: string | null;
};

export type ChatResult = {
  answer: string;
  file_name?: string | null;
};

export async function askChat(payload: ChatPayload): Promise<ChatResult> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  // get fresh Firebase token
  const token = await user.getIdToken();

  const { data } = await axios.post<ChatResult>(
    `${BASE_URL}/chat`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
}
