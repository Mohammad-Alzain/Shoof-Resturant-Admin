/* eslint-disable @typescript-eslint/no-explicit-any */
type objectR = Record<number | string, any>;
export const getLabelFromEnumValue = (
  Labels: objectR,
  Values: objectR,
  value: keyof objectR
): string | undefined => {
  let CorrectKey;
  Object.keys(Values).forEach((key) => {
    if (Values[key] === value) CorrectKey = key;
  });
  return Labels[CorrectKey];
};
export function generateOptionsFromEnums(
  Attribute_Type_Labels: objectR,
  Attribute_Type_Values: objectR
) {
  return Object.entries(Attribute_Type_Labels).map(([key, value]) => ({
    label: value,
    value: Attribute_Type_Values[key as keyof typeof Attribute_Type_Values],
  }));
}
