export function Steps({ current }: { current: 1 | 2 }) {
  const steps = ["Your location", "Your plants"];
  return (
    <ol className="flex gap-2 text-xs font-semibold">
      {steps.map((s, i) => (
        <li
          key={s}
          className={`rounded-full px-3 py-1 ${i + 1 === current ? "bg-leaf-700 text-white" : i + 1 < current ? "bg-leaf-100 text-leaf-700" : "bg-line text-muted"}`}
        >
          {i + 1}. {s}
        </li>
      ))}
    </ol>
  );
}
