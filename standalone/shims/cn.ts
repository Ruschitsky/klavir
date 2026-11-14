/** Class-name joiner for the offline build (the app itself uses clsx + tailwind-merge). */
export function cn(...inputs: unknown[]): string {
  return inputs.filter((value) => typeof value === "string" && value).join(" ");
}
