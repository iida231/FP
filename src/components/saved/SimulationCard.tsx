"use client";

import { useState } from "react";
import type { SimulationSummary } from "@/types";

type Props = {
  simulation: SimulationSummary;
  onView: (id: number) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, newName: string) => void;
};

export default function SimulationCard({
  simulation,
  onView,
  onDuplicate,
  onDelete,
  onRename,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(simulation.name);

  function handleEditConfirm() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== simulation.name) {
      onRename(simulation.id, trimmed);
    } else {
      setEditName(simulation.name);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleEditConfirm();
    } else if (e.key === "Escape") {
      setEditName(simulation.name);
      setIsEditing(false);
    }
  }

  function handleDeleteClick() {
    if (window.confirm(`「${simulation.name}」を削除しますか？`)) {
      onDelete(simulation.id);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
      {/* カード上部: シミュレーション名（インライン編集） */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleEditConfirm}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 text-sm font-semibold text-gray-800 border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
              {simulation.name}
            </span>
            <button
              onClick={() => {
                setEditName(simulation.name);
                setIsEditing(true);
              }}
              className="text-gray-400 hover:text-gray-600 text-xs px-1 flex-shrink-0"
              title="名前を編集"
            >
              ✏️
            </button>
          </>
        )}
      </div>

      {/* カード中部: 詳細情報 */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500">借入金額</dt>
        <dd className="text-gray-800 font-medium text-right">
          {simulation.loanAmount.toLocaleString()}万円
        </dd>

        <dt className="text-gray-500">返済期間</dt>
        <dd className="text-gray-800 font-medium text-right">
          {simulation.termYears}年
        </dd>

        <dt className="text-gray-500">総返済額</dt>
        <dd className="text-gray-800 font-medium text-right">
          {Math.round(simulation.totalPayment / 10000).toLocaleString()}万円
        </dd>

        <dt className="text-gray-500">保存日</dt>
        <dd className="text-gray-800 font-medium text-right">
          {new Date(simulation.createdAt).toLocaleDateString("ja-JP")}
        </dd>
      </dl>

      {/* カード下部: アクションボタン */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onView(simulation.id)}
          className="flex-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded px-2 py-1.5 transition-colors"
        >
          詳細表示
        </button>
        <button
          onClick={() => onDuplicate(simulation.id)}
          className="flex-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1.5 transition-colors"
        >
          複製
        </button>
        <button
          onClick={handleDeleteClick}
          className="flex-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded px-2 py-1.5 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
