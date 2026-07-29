import { ChangeEvent, useState } from "react";
import { ArrowLeft, Check, FileSpreadsheet, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Primitives";

type Row = {
  row: number;
  name: string;
  email: string;
  username: string;
  city: string;
  status: string;
  valid: boolean;
  error?: string;
};
const required = ["fullName", "username", "email", "city"];

export default function BulkUserImport() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [complete, setComplete] = useState(false);
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setComplete(false);
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      workbook.Sheets[workbook.SheetNames[0]],
      { defval: "" },
    );
    setRows(
      raw.map((record, index) => {
        const value = (key: string) =>
          String(
            record[key] ??
              record[
                key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)
              ] ??
              "",
          ).trim();
        const name = value("fullName");
        const username = value("username");
        const email = value("email");
        const city = value("city");
        const missing = required.filter((key) => !value(key));
        return {
          row: index + 2,
          name,
          username,
          email,
          city,
          status: value("status") || "Active",
          valid: !missing.length && /^\S+@\S+\.\S+$/.test(email),
          error: missing.length
            ? `Missing: ${missing.join(", ")}`
            : !/^\S+@\S+\.\S+$/.test(email)
              ? "Invalid email address"
              : undefined,
        };
      }),
    );
  };
  const valid = rows.filter((row) => row.valid);
  const commitImport = () => {
    const existing = JSON.parse(localStorage.getItem("skillswap-bulk-users") || "[]");
    const imported = valid.map((row, index) => ({
      id: Date.now() + index,
      fullName: row.name,
      username: row.username,
      email: row.email,
      phone: "Not provided",
      city: row.city,
      bio: "Imported by an administrator.",
      teachSkills: [],
      learnSkills: [],
      skillLevel: "Not set",
      learningMode: "Not set",
      availability: "Not set",
      role: "User",
      status: ["Active", "Pending", "Suspended", "Banned"].includes(row.status) ? row.status : "Active",
      rating: 0,
      totalReviews: 0,
      completedSwaps: 0,
      pendingSwaps: 0,
      cancelledSwaps: 0,
      reports: 0,
      joinedAt: new Date().toISOString().slice(0, 10),
      lastLogin: new Date().toISOString().slice(0, 10),
    }));
    localStorage.setItem("skillswap-bulk-users", JSON.stringify([...existing, ...imported]));
    setComplete(true);
    nav("/admin");
  };
  return (
    <main className="min-h-screen bg-[#f7f5f2] p-5 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to User Management
        </Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin workspace / users</p>
            <h1 className="mt-2 font-display text-4xl">Bulk user import</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
              Upload an Excel or CSV file to validate up to thousands of users
              before creating their profiles.
            </p>
          </div>
          <a
            href="data:text/csv;charset=utf-8,fullName%2Cusername%2Cemail%2Ccity%2Cstatus%0AJohn%20Doe%2Cjohndoe%2Cjohn%40example.com%2CAhmedabad%2CActive"
            download="skillswap-users-template.csv"
            className="text-sm font-bold text-violet"
          >
            Download CSV template
          </a>
        </div>
        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 px-6 py-12 text-center hover:border-violet hover:bg-violet/[.02]">
            <FileSpreadsheet size={36} className="text-violet" />
            <p className="mt-4 font-bold">
              {fileName || "Choose an Excel or CSV file"}
            </p>
            <p className="mt-1 text-sm text-ink/50">
              Required columns: Full Name, Username, Email, City
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={readFile}
            />
          </label>
          {rows.length > 0 && (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Summary label="Rows found" value={rows.length} />
                <Summary label="Ready to import" value={valid.length} green />
                <Summary
                  label="Needs attention"
                  value={rows.length - valid.length}
                  red
                />
              </div>
              <div className="mt-6 overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[#f7f5f2] text-xs uppercase text-ink/45">
                    <tr>
                      {[
                        "Row",
                        "Full name",
                        "Username",
                        "Email",
                        "City",
                        "Status",
                      ].map((cell) => (
                        <th className="p-3" key={cell}>
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 50).map((row) => (
                      <tr
                        key={row.row}
                        className={row.valid ? "" : "bg-rose-50"}
                      >
                        <td className="p-3 text-ink/50">{row.row}</td>
                        <td className="p-3 font-bold">{row.name || "—"}</td>
                        <td className="p-3">{row.username || "—"}</td>
                        <td className="p-3">{row.email || "—"}</td>
                        <td className="p-3">{row.city || "—"}</td>
                        <td className="p-3">
                          <span
                            className={
                              row.valid ? "text-emerald-700" : "text-rose-700"
                            }
                          >
                            {row.valid ? row.status : row.error}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <p className="mt-3 text-center text-xs text-ink/50">
                  Showing the first 50 of {rows.length} rows.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setRows([]);
                    setFileName("");
                  }}
                  className="bg-white text-ink ring-1 ring-ink/10"
                >
                  <X size={16} />
                  Clear
                </Button>
                <Button
                  disabled={!valid.length || complete}
                  onClick={commitImport}
                  className="bg-violet text-white hover:bg-ink"
                >
                  <Upload size={16} />
                  {complete ? "Imported" : `Import ${valid.length} users`}
                </Button>
              </div>
              {complete && (
                <p className="mt-4 rounded-xl bg-mint p-3 text-sm font-bold text-emerald-900">
                  <Check className="mr-2 inline" size={16} />
                  Validated users are ready for server-side account
                  provisioning.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
function Summary({
  label,
  value,
  green,
  red,
}: {
  label: string;
  value: number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${green ? "bg-emerald-50" : red ? "bg-rose-50" : "bg-[#f7f5f2]"}`}
    >
      <p className="text-xs font-bold text-ink/50">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
}
