"use client";

import { useCallback, useEffect, useState } from "react";
import type { SimulationDetail, SimulationSummary } from "@/types";
import SimulationCard from "./SimulationCard";

type Props = {
  onLoadSimulation: (detail: SimulationDetail) => void;
};

export default function SavedList({ onLoadSimulation }: Props) {
  const [simulations, setSimulations] = useState<SimulationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSimulations = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/simulations");
      if (!res.ok) throw new Error("fetch failed");
      const data: SimulationSummary[] = await res.json();
      setSimulations(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  async function handleView(id: number) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    onLoadSimulation(detail);
  }

  async function handleDuplicate(id: number) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    await fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...detail, name: detail.name + "（コピー）" }),
    });
    fetchSimulations();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    setSimulations((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleRename(id: number, newName: string) {
    const res = await fetch(`/api/simulations/${id}`);
    const detail: SimulationDetail = await res.json();
    await fetch(`/api/simulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...detail, name: newName }),
    });
    setSimulations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500 text-sm">
        取得に失敗しました
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        保存されたシミュレーションはありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {simulations.map((simulation) => (
        <SimulationCard
          key={simulation.id}
          simulation={simulation}
          onView={handleView}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}
    </div>
  );
}
