/**
 * [value, label]
 */
export type Option = [string | number, string];

interface ActionBase {
  success: string | null;
  error: string | null;
  redirect?: string;
  ok: boolean;
}

export interface ActionFail extends ActionBase {
  success: null;
  error: string;
  ok: false;
}

export interface ActionSuccess extends ActionBase {
  success: string;
  error: null;
  ok: true;
}

export type ActionResult = ActionSuccess | ActionFail;

export type FormActionFunction = (formData: FormData) => Promise<ActionResult>;

export type ActionInput = Record<string, string | number | boolean | null>;
export type ActionFunction = (input: ActionInput) => Promise<ActionResult>;
