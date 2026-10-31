import { dialog } from "@/components/ui/AppDialog";

export const confirmDelete = async (label: string, onConfirm: () => void) => {
  const ok = await dialog.confirm({
    title: "Delete?",
    message: `"${label}" will be deleted. This cannot be undone.`,
    confirmText: "Delete",
    destructive: true,
  });
  if (ok) onConfirm();
};
