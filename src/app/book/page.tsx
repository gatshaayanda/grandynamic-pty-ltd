import { redirect } from "next/navigation";

// This URL belonged to an unrelated inherited assistance workflow. Grandynamic
// accepts welding and fabrication enquiries through the project enquiry flow.
export default function LegacyBookRedirect() {
  redirect("/enquiry");
}
