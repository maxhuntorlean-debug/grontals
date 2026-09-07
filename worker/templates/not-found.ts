export function renderNotFoundContent(): string {
	return `
	<div class="container not-found">
		<h1>Siden finnes ikke</h1>
		<p>Vi fant ikke siden du lette etter.</p>
		<a class="button" href="/">Tilbake til forsiden</a>
	</div>
	`;
}
