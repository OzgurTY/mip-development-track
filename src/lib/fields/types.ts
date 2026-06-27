export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiselect";

export type FieldDefinition = {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
  is_sensitive: boolean;
  sort_order: number;
};
