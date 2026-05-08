"use client";

import type { LifeEventInput } from "@/types";

type Props = {
  events: LifeEventInput[];
  onChange: (events: LifeEventInput[]) => void;
};

export default function LifeEventsTable({ events, onChange }: Props) {
  const handleFieldChange = (
    id: string,
    field: keyof Omit<LifeEventInput, "id">,
    raw: string
  ) => {
    onChange(
      events.map((ev) => {
        if (ev.id !== id) return ev;
        if (field === "eventName") {
          return { ...ev, eventName: raw };
        }
        const num = parseFloat(raw);
        return { ...ev, [field]: isNaN(num) ? 0 : num };
      })
    );
  };

  const handleAdd = () => {
    const newEvent: LifeEventInput = {
      id: Date.now().toString(),
      eventName: "",
      year: 1,
      amount: 0,
    };
    onChange([...events, newEvent]);
  };

  const handleDelete = (id: string) => {
    onChange(events.filter((ev) => ev.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">ライフイベント</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs">
              <th className="text-left px-3 py-2 font-medium">イベント名</th>
              <th className="text-left px-3 py-2 font-medium">
                年（ローン開始からの年数）
              </th>
              <th className="text-left px-3 py-2 font-medium">金額（万円）</th>
              <th className="text-left px-3 py-2 font-medium">削除</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={ev.eventName}
                    onChange={(e) =>
                      handleFieldChange(ev.id, "eventName", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={ev.year}
                    onChange={(e) =>
                      handleFieldChange(ev.id, "year", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={ev.amount}
                    onChange={(e) =>
                      handleFieldChange(ev.id, "amount", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
      >
        + 行を追加
      </button>
    </div>
  );
}
