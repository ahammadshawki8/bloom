import { QuietPage } from "@/components/brand/QuietPage";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <QuietPage title="This page isn't here" action={<ButtonLink href="/studio">Go to your studio</ButtonLink>}>
      The link may be old or mistyped. Everything you&apos;ve made is safe.
    </QuietPage>
  );
}
