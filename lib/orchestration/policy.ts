export function shouldGateForRedFlags(input: string, logs: Array<any> = []): boolean {
  const redInText =
    /(numb|tingl|loss of sensation|fever|severe|unbearable)/i.test(input) ||
    /(8|9|10)\/?10/.test(input);

  const severeInLogs = logs.some((l: any) => (l?.pain ?? 0) >= 7);

  return redInText || severeInLogs;
}
