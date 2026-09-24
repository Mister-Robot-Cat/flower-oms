import { requirePageUser } from "@/lib/session";
import NewOrderForm from "./ui/NewOrderForm";

export default async function NewOrderPage() {
  await requirePageUser(["ADMIN", "CALL_CENTER"], "/orders/new");
  return <NewOrderForm />;
}
