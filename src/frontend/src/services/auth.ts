export async function register(
	email: string,
	username: string,
	password: string
	)
{
	const response = await fetch("/api/auth/register", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email,
			username,
			password,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Erreur lors de l'inscription");
	}

	return response.json();
}

export async function login(
	email: string,
	password: string
	)
{
	const response = await fetch("/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email,
			password,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Erreur lors de la connexion");
	}

	return response.json();
}