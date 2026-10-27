import { redirect } from "next/navigation";

// This inherited URL was for Namane Tyres roadside assistance. Grandynamic
// accepts welding and fabrication enquiries through the project enquiry flow.
export default function LegacyBookRedirect() {
  redirect("/enquiry");
}
