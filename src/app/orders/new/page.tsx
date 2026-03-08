import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewOrderForm from "./ui/NewOrderForm";

export default async function NewOrderPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/orders/new");
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN" && role !== "CALL_CENTER") {
    redirect("/dashboard");
  }

  return <NewOrderForm />;
}
