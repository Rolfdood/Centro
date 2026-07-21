const UNSAFE_EXECUTABLE_SYNTAX = [
  /```/,
  /<\s*\/?\s*(?:script|style)\b/i,
  /^\s*(?:curl|wget|npm|pnpm|yarn|node|python(?:3)?|bash|sh|powershell|cmd)\b/im,
  /^\s*(?:import|export)\s+/im,
  /^\s*(?:const|let|var|function|class|interface|type)\s+[A-Za-z_$]/im,
];

export class UnsafeSocialCopyError extends Error {
  constructor() {
    super("AI output contains unsafe executable syntax.");
    this.name = "UnsafeSocialCopyError";
  }
}

export function assertSafeSocialCopy(text: string): void {
  if (UNSAFE_EXECUTABLE_SYNTAX.some((pattern) => pattern.test(text))) {
    throw new UnsafeSocialCopyError();
  }
}
