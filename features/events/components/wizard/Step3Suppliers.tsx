"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Building2, Loader2, RefreshCw } from "lucide-react";
import { listSuppliers } from "@/features/suppliers/server/listSuppliers";

type Supplier = {
  id: string;
  legalName: string;
  contactEmail: string | null;
  countryCode: string | null;
};

interface Step3SuppliersProps {
  mode?: "create" | "edit";
  selectedIds: string[];
  onNext: (selectedIds: string[]) => void;
  onBack: () => void;
}

export function Step3Suppliers({
  mode = "create",
  selectedIds,
  onNext,
  onBack,
}: Step3SuppliersProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setError("Unable to load suppliers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.toLowerCase();

    return (
      supplier.legalName.toLowerCase().includes(query) ||
      supplier.contactEmail?.toLowerCase().includes(query)
    );
  });

  const selectedSuppliers = suppliers.filter((supplier) =>
    selected.has(supplier.id),
  );

  const toggleSupplier = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const submit = () => {
    onNext(Array.from(selected));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">
            {mode === "edit" ? "Manage Suppliers" : "Select Suppliers"}
          </h3>

          <p className="text-sm text-slate-500">
            {mode === "edit"
              ? "Update the suppliers associated with this sourcing event."
              : "Choose suppliers from your private directory to invite."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Supplier
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by company name or email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selected.size > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Selected suppliers
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.size} supplier{selected.size !== 1 && "s"} selected
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="text-slate-500 hover:text-red-600"
            >
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            {selectedSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {supplier.legalName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {supplier.contactEmail || "No email provided"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSupplier(supplier.id)}
                  className="ml-3 text-slate-400 hover:text-red-600"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mb-3" />
            <p className="text-sm">Loading suppliers...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSuppliers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <Building2 className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-700">
              No suppliers yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Add suppliers to your directory before inviting them.
            </p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No suppliers found matching "{search}".
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-100 overflow-y-auto">
            {filteredSuppliers.map((supplier) => (
              <li
                key={supplier.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => toggleSupplier(supplier.id)}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                    id={`checkbox-${supplier.id}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {supplier.legalName}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {supplier.contactEmail || "No email provided"}
                  </p>
                </div>

                {supplier.countryCode && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    <Building2 className="h-3 w-3" />
                    {supplier.countryCode}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button
          onClick={submit}
          disabled={isLoading || !!error}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {mode === "edit" ? "Save Supplier Selection" : "Continue"}
          <span className="ml-1">({selected.size})</span>
        </Button>
      </div>
    </div>
  );
}
