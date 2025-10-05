import { io as Client } from "socket.io-client";

// Adjust URL if your socket server runs elsewhere
const URL = process.env.SOCKET_URL || "http://localhost:4001";

function wait(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function run() {
	console.log("Starting socket test...");

	const a = Client(URL, { reconnection: false });
	const b = Client(URL, { reconnection: false });

	// track events
	a.on("connect", () => console.log("A connected", a.id));
	b.on("connect", () => console.log("B connected", b.id));

	a.on("message:new", ({ message }) =>
		console.log("A got message:new", message.id || message)
	);
	b.on("message:new", ({ message }) =>
		console.log("B got message:new", message.id || message)
	);

	// wait for connects
	await wait(500);

	const conversationId = "test-conv-1";

	// Join only B to the conversation room
	b.emit("conversation:join", { conversationId });
	console.log("B asked to join conversation room");

	await wait(500);

	// Emit test message via server helper; server will emit to conversation room and user rooms
	const testMessage = { id: "m-1", conversationId, content: "hello" };

	// Use A to trigger __test:emit to simulate server path
	a.emit("__test:emit", {
		conversationId,
		message: testMessage,
		memberIds: ["A-user", "B-user"],
	});

	await wait(1000);

	console.log("Done");
	a.close();
	b.close();
}

run().catch((e) => console.error(e));
