import { createClient } from "@/lib/supabase/server";

export type OrganizationDetails = {
  name: string;
  legal_name: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  status: string;
};

const detail = (value: string | null) => value || "Not provided";

export async function sendOrganizationWelcomeEmail({
  email,
  organization,
  loginDetails,
}: {
  email: string;
  organization: OrganizationDetails;
  loginDetails?: { email: string; password: string };
}) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return { status: "not_configured" as const };
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${process.env.RESEND_FROM_NAME ?? "Easy Collection"} <${process.env.RESEND_FROM}>`,
      to: [email],
      subject: `Welcome to Easy Collection, ${organization.name}`,
      html: `
        <div style="margin:0;background:#f4f7f6;padding:40px 20px;font-family:Arial,sans-serif;color:#18312c">
          <div style="margin:0 auto;max-width:600px;overflow:hidden;border:1px solid #dce8e3;background:#ffffff;border-radius:20px">
            <div style="background:#103c34;padding:34px 36px;color:#ffffff">
              <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a8e6c7">Easy Collection</div>
              <h1 style="margin:18px 0 0;font-size:30px;line-height:1.15">Welcome aboard, ${organization.name}</h1>
            </div>
            <div style="padding:36px">
              <p style="margin:0;font-size:16px;line-height:1.7">Your organization has been added to Easy Collection. Here are the details saved for your account:</p>
              <table style="width:100%;margin:24px 0;border-collapse:collapse;font-size:14px;line-height:1.5">
                <tr><td style="padding:8px 0;color:#58706a">Organization</td><td style="padding:8px 0;font-weight:700">${detail(organization.name)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Legal name</td><td style="padding:8px 0">${detail(organization.legal_name)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Email</td><td style="padding:8px 0">${detail(organization.contact_email)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Phone</td><td style="padding:8px 0">${detail(organization.phone)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Address</td><td style="padding:8px 0">${detail(organization.address)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Location</td><td style="padding:8px 0">${[organization.city, organization.state, organization.country].filter(Boolean).join(", ") || "Not provided"}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Pincode</td><td style="padding:8px 0">${detail(organization.pincode)}</td></tr>
                <tr><td style="padding:8px 0;color:#58706a">Status</td><td style="padding:8px 0;font-weight:700;color:#39735a">${detail(organization.status)}</td></tr>
              </table>
              ${loginDetails ? `<div style="margin:28px 0;padding:20px;border-radius:14px;background:#fff7e6;border:1px solid #f2dfb2"><div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8a641c">Your login details</div><p style="margin:10px 0 0;font-size:15px;line-height:1.7"><strong>Login:</strong> ${loginDetails.email}<br><strong>Temporary password:</strong> ${loginDetails.password}</p><p style="margin:8px 0 0;font-size:12px;color:#806d4a">Please change this password after your first login.</p></div>` : ""}
              <div style="margin:28px 0;padding:20px;border-radius:14px;background:#eef8f2">
                <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#39735a">Next step</div>
                <p style="margin:8px 0 0;font-size:15px;line-height:1.6">Our team will share your access details and onboarding steps shortly.</p>
              </div>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#58706a">If you have any questions, reply to this email and our team will be happy to help.</p>
              <p style="margin:28px 0 0;font-size:15px;line-height:1.7">Warmly,<br><strong>The Easy Collection team</strong></p>
            </div>
            <div style="border-top:1px solid #e7efeb;padding:20px 36px;font-size:12px;color:#7b918a">Simple tools for teams that keep communities moving.</div>
          </div>
        </div>
      `,
    }),
  });

  return { status: emailResponse.ok ? ("sent" as const) : ("failed" as const) };
}

export async function getOrganizationForEmail(organizationId: string) {
  const supabase = await createClient();
  return supabase
    .from("organizations")
    .select("name, legal_name, contact_email, phone, address, city, state, country, pincode, status")
    .eq("id", organizationId)
    .single();
}