import { Suspense } from "react";
import { ReadyGate } from "@/components/AppShell";
import { EquipmentView } from "@/components/equipment/EquipmentView";

export default function EquipmentPage() {
  // useSearchParams (for ?focus=) needs a Suspense boundary.
  return (
    <ReadyGate>
      <Suspense>
        <EquipmentView />
      </Suspense>
    </ReadyGate>
  );
}
