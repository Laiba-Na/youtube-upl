import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { google } from "googleapis";

export async function getYouTubeToken(userId: string): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.googleRefreshToken) {
    throw new Error("No Google refresh token available in session");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/callback/google"
  );

  oauth2Client.setCredentials({
    refresh_token: session.googleRefreshToken,
  });

  const { token } = await oauth2Client.getAccessToken();
  return token as string;
}
