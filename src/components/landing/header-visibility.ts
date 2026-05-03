interface HeaderCreditVisibilityInput {
  isByokMode: boolean;
  hasUser: boolean;
}

export function shouldShowCreditBalanceInHeader({
  isByokMode,
  hasUser,
}: HeaderCreditVisibilityInput): boolean {
  return hasUser && !isByokMode;
}
