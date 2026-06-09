import { FieldValues, UseFormReturn } from "react-hook-form";
import { HTTPError } from "ky";
import { toast } from "sonner";


export async function handleApiError<TFieldValues extends FieldValues>(
  error: unknown,
  form?: UseFormReturn<TFieldValues>
) {
  if (error instanceof HTTPError) {
    try {
      const responseWithCache = error.response as Response & { errorData?: { errors?: Record<string, string>; detail?: string } };
      const errorData = responseWithCache.errorData || await error.response.clone().json();
      console.log("Error Data parsed:", errorData);

      if (errorData?.errors) {
        Object.entries(errorData.errors).forEach(([field, msg]) => {
          const messageStr = typeof msg === "string" ? msg : String(msg);
          if (field === "non_field_errors" || !form) {
            toast.error(messageStr);
          } else {
            form.setError(field as Parameters<typeof form.setError>[0], { message: messageStr });
          }
        });
        return;
      }
      if (errorData?.detail) {
        toast.error(errorData.detail);
        return;
      }
    } catch (e) {
      console.error("Failed to parse JSON error response:", e);
    }
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
  toast.error(message);
}
