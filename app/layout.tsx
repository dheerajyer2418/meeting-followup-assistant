import type { Metadata } from "next";
import "./globals.css";

// Google Search Console verification token — public by design (appears in page source).
// Used to verify ownership so we can request a Safe Browsing review for this hostname.
const gscToken = process.env.NEXT_PUBLIC_GSC_TOKEN?.trim() || "91a556u1FUq7UUtvLt0mvUsZN0uluiorKn7PGyxrdzY";

export const metadata: Metadata = {
  title: "Meeting Follow-up Assistant | Cloudasta",
  description: "Compare, review, and approve meeting follow-ups with evidence. Nothing is sent.",
  ...(gscToken ? { verification: { google: gscToken } } : {}),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
