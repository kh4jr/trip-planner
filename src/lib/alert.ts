export type AlertType = "success" | "error";

export interface AlertPayload {
  type: AlertType;
  message: string;
}

export function errorAlert(message: string): AlertPayload {
  return {
    type: "error",
    message,
  };
}

export function successAlert(message: string): AlertPayload {
  return {
    type: "success",
    message,
  };
}
