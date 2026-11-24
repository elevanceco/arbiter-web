"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export type SourcingItemData = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  specification?: string;
};

export type SourcingLotData = {
  id: string;
  name: string;
  items: SourcingItemData[];
};

interface Step2LotsItemsProps {
  initialLots: SourcingLotData[];
  onNext: (lots: SourcingLotData[]) => void;
  onBack: () => void;
}

export function Step2LotsItems({
  initialLots,
  onNext,
  onBack,
}: Step2LotsItemsProps) {
  const [lots, setLots] = useState<SourcingLotData[]>(
    initialLots.length > 0
      ? initialLots
      : [{ id: "lot-1", name: "Lot 1", items: [] }],
  );

  const addLot = () => {
    setLots([
      ...lots,
      { id: `lot-${Date.now()}`, name: `Lot ${lots.length + 1}`, items: [] },
    ]);
  };

  const addItem = (lotId: string) => {
    setLots(
      lots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            items: [
              ...lot.items,
              {
                id: `item-${Date.now()}`,
                name: "",
                quantity: "",
                unit: "PCS",
                specification: "",
              },
            ],
          };
        }
        return lot;
      }),
    );
  };

  const updateItem = (
    lotId: string,
    itemId: string,
    field: keyof SourcingItemData,
    value: string,
  ) => {
    setLots(
      lots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            items: lot.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item,
            ),
          };
        }
        return lot;
      }),
    );
  };

  const removeItem = (lotId: string, itemId: string) => {
    setLots(
      lots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            items: lot.items.filter((item) => item.id !== itemId),
          };
        }
        return lot;
      }),
    );
  };

  const removeLot = (lotId: string) => {
    setLots((prev) => prev.filter((lot) => lot.id !== lotId));
  };

  const handleNext = () => {
    // Basic validation: ensure all items have a name and quantity
    onNext(lots);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {lots.map((lot, lotIndex) => (
        <div
          key={lot.id}
          className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
        >
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <Input
              value={lot.name}
              onChange={(e) =>
                setLots((prev) =>
                  prev.map((l) =>
                    l.id === lot.id ? { ...l, name: e.target.value } : l,
                  ),
                )
              }
              className="w-1/3 font-medium bg-transparent border-transparent hover:border-slate-300 focus:bg-white"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLot(lot.id)}
              disabled={lots.length === 1}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4">
            {lot.items.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No items added to this lot yet.
              </div>
            ) : (
              <table className="w-full text-sm text-left mb-4">
                <thead className="text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="pb-2 w-1/3">Item Name</th>
                    <th className="pb-2 w-2/5">Specification</th>
                    <th className="pb-2 w-1/6">Quantity</th>
                    <th className="pb-2 w-1/6">Unit</th>
                    <th className="pb-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lot.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(lot.id, item.id, "name", e.target.value)
                          }
                          placeholder="e.g. Corrugated Box A"
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Textarea
                          value={item.specification || ""}
                          onChange={(e) =>
                            updateItem(
                              lot.id,
                              item.id,
                              "specification",
                              e.target.value,
                            )
                          }
                          placeholder="500x300x200"
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              lot.id,
                              item.id,
                              "quantity",
                              e.target.value,
                            )
                          }
                          placeholder="5000"
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(lot.id, item.id, "unit", e.target.value)
                          }
                          placeholder="PCS"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(lot.id, item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem(lot.id)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={addLot} className="text-slate-700">
          <Plus className="h-4 w-4 mr-2" /> Add Another Lot
        </Button>
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
