/** "1499" -> "1 499 kr" (Norwegian thousands separator, kr suffix, no decimals). */
export function formatNok(amount: number): string {
	const withSpaces = Math.round(amount)
		.toString()
		.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	return `${withSpaces} kr`;
}
