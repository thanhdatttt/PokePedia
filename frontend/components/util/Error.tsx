"use client";

export function Error({ error }: { error: string }) {
  return (
    <div className="bg-red-100 text-destructive text-base font-medium text-center mt-2 p-4 rounded-md">
      {error}
    </div>
  );
};