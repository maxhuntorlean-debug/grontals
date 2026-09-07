import { ApiError, login } from "../api";

export function renderLogin(root: HTMLElement, onSuccess: () => void): void {
	root.innerHTML = `
		<div class="admin-login">
			<h1>GRØNTALS admin</h1>
			<div class="admin-message admin-message--error" id="login-error" hidden></div>
			<form id="login-form" novalidate>
				<div class="field">
					<label for="login-username">Brukernavn</label>
					<input id="login-username" name="username" type="text" autocomplete="username" required>
				</div>
				<div class="field">
					<label for="login-password">Passord</label>
					<input id="login-password" name="password" type="password" autocomplete="current-password" required>
				</div>
				<button class="button" type="submit" style="width:100%">Logg inn</button>
			</form>
		</div>
	`;

	const form = root.querySelector<HTMLFormElement>("#login-form")!;
	const errorEl = root.querySelector<HTMLDivElement>("#login-error")!;
	const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		void handleSubmit();
	});

	async function handleSubmit(): Promise<void> {
		errorEl.hidden = true;
		submitButton.disabled = true;
		submitButton.textContent = "Logger inn…";

		const formData = new FormData(form);
		const username = String(formData.get("username") ?? "");
		const password = String(formData.get("password") ?? "");

		try {
			await login(username, password);
			onSuccess();
		} catch (err) {
			errorEl.textContent = err instanceof ApiError ? err.message : "Noe gikk galt. Prøv igjen.";
			errorEl.hidden = false;
			submitButton.disabled = false;
			submitButton.textContent = "Logg inn";
		}
	}
}
