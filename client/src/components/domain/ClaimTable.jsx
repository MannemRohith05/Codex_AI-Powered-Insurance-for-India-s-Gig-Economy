import { Card } from "../ui/Card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const mockClaims = [
  { id: "CLM-9092", date: "Oct 24, 2023", trigger: "Heavy Rain > 10mm/hr", status: "paid", amount: "₹450" },
  { id: "CLM-9091", date: "Oct 20, 2023", trigger: "Heatwave > 40°C", status: "processing", amount: "₹300" },
  { id: "CLM-9088", date: "Oct 12, 2023", trigger: "AQI > 400", status: "rejected", amount: "₹0" },
];

export function ClaimTable() {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 font-medium">Claim ID</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Trigger</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {mockClaims.map((claim) => (
              <tr key={claim.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 font-medium text-zinc-900">{claim.id}</td>
                <td className="px-6 py-4 text-zinc-600">{claim.date}</td>
                <td className="px-6 py-4 text-zinc-600">{claim.trigger}</td>
                <td className="px-6 py-4 font-medium">{claim.amount}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {claim.status === "paid" && <><CheckCircle2 className="h-4 w-4 text-success-500" /><span className="text-success-700 font-medium">Auto-Paid</span></>}
                    {claim.status === "processing" && <><Clock className="h-4 w-4 text-warning-500" /><span className="text-warning-700 font-medium">Verifying</span></>}
                    {claim.status === "rejected" && <><XCircle className="h-4 w-4 text-danger-500" /><span className="text-danger-700 font-medium">Denied</span></>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
