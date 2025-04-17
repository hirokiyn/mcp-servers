import { loadCredentialsAndRunServer } from "./services/google-drive/index";

async function main() {
	try {
		await loadCredentialsAndRunServer();
		console.log("All services started successfully.");
	} catch (error) {
		console.error("Failed to start services:", error);
		process.exit(1);
	}
}

main();
