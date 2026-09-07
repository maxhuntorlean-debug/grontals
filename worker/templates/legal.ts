import { escapeHtml } from "../lib/html";

export interface LegalPage {
	title: string;
	description: string;
	body: (phone: string) => string;
}

const PLACEHOLDER_NOTE =
	'<p class="placeholder-note">Denne siden mangler foreløpig eierens virksomhetsinformasjon. Fylles inn før lansering &mdash; se README for hva som må erstattes.</p>';

export const LEGAL_PAGES: Record<string, LegalPage> = {
	"om-oss": {
		title: "Om oss – GRØNTALS",
		description: "Om GRØNTALS: nettbutikk for kompatible byggeklosser i Norge.",
		body: () => `
			<h1>Om oss</h1>
			<p>GRØNTALS selger kompatible byggeklosser for barn og voksne &mdash; kjøretøy, byggverk, romstasjoner og mer. Vi legger vekt på god byggekvalitet og tydelig deleliste på alle sett.</p>
			<p>[Sett inn en kort historie om virksomheten, hvem som driver den, og hvorfor.]</p>
			${PLACEHOLDER_NOTE}
		`,
	},
	kontakt: {
		title: "Kontakt – GRØNTALS",
		description: "Kontaktinformasjon til GRØNTALS. Bestilling gjøres på telefon.",
		body: (phone) => `
			<h1>Kontakt</h1>
			<p>Bestilling gjøres enkelt på telefon:</p>
			<p><a class="button" href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}">${escapeHtml(phone)}</a></p>
			<p>E-post: [sett inn e-postadresse]<br>Åpningstider: [sett inn åpningstider]</p>
			${PLACEHOLDER_NOTE}
		`,
	},
	personvern: {
		title: "Personvern – GRØNTALS",
		description: "Personvernerklæring for GRØNTALS.",
		body: () => `
			<h1>Personvern</h1>
			<p>Denne siden beskriver hvordan GRØNTALS behandler personopplysninger i forbindelse med bestillinger og kontakt.</p>
			<p>[Sett inn hvilke opplysninger som samles inn (f.eks. navn, telefonnummer ved bestilling), hvordan de brukes og lagres, og kontaktinformasjon for personvernspørsmål.]</p>
			${PLACEHOLDER_NOTE}
		`,
	},
	vilkar: {
		title: "Vilkår – GRØNTALS",
		description: "Kjøpsvilkår og betingelser for bestilling hos GRØNTALS.",
		body: () => `
			<h1>Vilkår</h1>
			<p>Disse vilkårene gjelder for bestillinger gjort hos GRØNTALS på telefon.</p>
			<p>[Sett inn organisasjonsnummer, angrerett, leveringsbetingelser, betalingsmåte og reklamasjonsinformasjon.]</p>
			${PLACEHOLDER_NOTE}
		`,
	},
};
