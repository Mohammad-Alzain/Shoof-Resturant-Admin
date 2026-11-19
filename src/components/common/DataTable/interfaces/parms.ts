export interface Iparams {
  set: (parms_name: string, value: string) => void;
}
export interface DataParams {
  [key: string]: string | number | undefined;
}
