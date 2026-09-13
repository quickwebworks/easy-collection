import { redirect } from "next/navigation";
import { getUserRole } from "./get-user-role";

export async function redirectByRole() {
  const role = await getUserRole();

  if (!role) {
    redirect("/login");
  }

  switch (role) {
    case "SUPER_ADMIN":
      redirect("/super-admin");

    case "CLIENT":
      redirect("/client");

    case "MANAGER":
      redirect("/manager");

    case "FIELD_EXECUTIVE":
      redirect("/field-executive");

    case "BACKEND":
      redirect("/backend");

    default:
      redirect("/login");
  }
}