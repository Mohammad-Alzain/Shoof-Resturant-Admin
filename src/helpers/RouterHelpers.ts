export function getCurrentUrl(pathname: string) {
  return pathname.split(/[?#]/)[0];
}

export function checkIsActive(
  pathname: string,
  href: string,
  options: { strict?: boolean } = {}
) {
  const current = getCurrentUrl(pathname);
  if (!current || !href) return false;

  const normalizedCurrent = current.startsWith("/") ? current : `/${current}`;
  const normalizedHref = href.startsWith("/") ? href : `/${href}`;

  if (options.strict) {
    return normalizedCurrent === normalizedHref;
  }

  return (
    normalizedCurrent === normalizedHref ||
    normalizedCurrent.startsWith(`${normalizedHref}/`)
  );
}
