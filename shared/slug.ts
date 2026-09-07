/** Transliteration for Norwegian letters not allowed in URL slugs. */
const CHAR_MAP: Record<string, string> = {
	å: "a",
	Å: "a",
	ø: "o",
	Ø: "o",
	æ: "ae",
	Æ: "ae",
};

/**
 * "Sportsbil 1286 deler" -> "sportsbil-1286-deler"
 * Admins can still override the result manually.
 */
export function slugify(input: string): string {
	const transliterated = input.replace(/[åÅøØæÆ]/g, (ch) => CHAR_MAP[ch] ?? ch);

	return transliterated
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}
