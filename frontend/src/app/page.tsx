import { redirect } from "next/navigation";

// Each portal has its own address and no password: the public portal is the front door,
// murabbis use /attendance and admins use /dashboard. Those two are deliberately not linked from here.
export default function Home() {
  redirect("/portal");
}
