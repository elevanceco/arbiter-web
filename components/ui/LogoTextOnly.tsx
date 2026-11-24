interface LogoTextOnlyProps {
  isDarkMode?: boolean;
}

export default function LogoTextOnly({
  isDarkMode = false,
}: LogoTextOnlyProps) {
  return (
    <span className="font-semibold tracking-tight">
      <span className={isDarkMode ? "text-white" : "text-foreground"}>
        Arbiter
      </span>
    </span>
  );
}
