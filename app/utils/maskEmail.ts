function maskPart(value: string) {
  if (value.length <= 1) return "*";
  if (value.length === 2) return `${value[0]}*`;
  return `${value[0]}${"*".repeat(Math.min(value.length - 1, 6))}`;
}

export function maskEmail(email: string) {
  const [local, domain = ""] = email.split("@");
  const [domainName, ...suffix] = domain.split(".");
  const suffixText = suffix.length ? `.${suffix.join(".")}` : "";

  return `${maskPart(local)}@${maskPart(domainName)}${suffixText}`;
}
