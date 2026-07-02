import { NextResponse } from "next/server";

export function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const decodedPathname = decodeURIComponent(pathname);

  if (
    decodedPathname === "/gebärdensprache" ||
    decodedPathname === "/gebaerdensprache"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-translate";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/geb%C3%A4rdensprache", "/gebärdensprache", "/gebaerdensprache"],
};
