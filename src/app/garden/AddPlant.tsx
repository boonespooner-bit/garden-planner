"use client";

import { useActionState } from "react";
import { addPlantAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/SubmitButton";

export function AddLibraryPlant({ plantKey, name, detail }: { plantKey: string; name: string; detail: string }) {
  const [state, action] = useActionState(addPlantAction, undefined);
  return (
    <form action={action} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2">
      <input type="hidden" name="plantKey" value={plantKey} />
      <div className="min-w-0">
        <div className="font-semibold">{name}</div>
        <div className="truncate text-xs text-muted">{detail}</div>
        {state?.error && <p className="text-xs text-warn">{state.error}</p>}
        {state?.message && <p className="text-xs text-leaf-700">✓ {state.message}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor={`qty-${plantKey}`}>
          How many
        </label>
        <input
          id={`qty-${plantKey}`}
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          className="input !w-16 !py-1.5 text-center"
          title="How many"
        />
        <SubmitButton className="btn !py-1.5" pendingText="Adding…">
          Add
        </SubmitButton>
      </div>
    </form>
  );
}

export function AddCustomPlant({ name }: { name: string }) {
  const [state, action] = useActionState(addPlantAction, undefined);
  return (
    <form action={action} className="card space-y-3 border-dashed">
      <input type="hidden" name="customName" value={name} />
      <div>
        <div className="font-semibold">Not in our library? Add &ldquo;{name}&rdquo; anyway</div>
        <p className="text-sm text-muted">
          Our plant expert AI will write a full care plan (pruning, feeding, sprays and soil) for it. It takes about a minute
          and is marked &ldquo;AI-written&rdquo; so you know to double-check it.
        </p>
      </div>
      <SubmitButton pendingText="Writing a care plan… (about a minute)">✨ Create care plan for &ldquo;{name}&rdquo;</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
