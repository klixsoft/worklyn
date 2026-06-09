import { FieldValues, UseFormReturn } from "react-hook-form";
import { HTTPError } from "ky";
import { toast } from "sonner";


export async function handleApiError<TFieldValues extends FieldValues>(
  error: unknown,
  form?: UseFormReturn<TFieldValues, any>
) {
  /**
   * Processes API error schemas and maps them dynamically to form fields or general toast notifications.
   */
  if (error instanceof HTTPError) {
    try {
      const errorData = await error.response.clone().json();
      if (errorData?.errors) {
        Object.entries(errorData.errors).forEach(([field, msg]) => {
          if (field === "non_field_errors" || !form) {
            toast.error(msg as string);
          } else {
            form.setError(field as any, { message: msg as string });
          }
        });
        return;
      }
    } catch {
      /**
       * Fallback when response body is not in JSON format.
       */
    }
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
  toast.error(message);
}
