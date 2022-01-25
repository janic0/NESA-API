import Fastify from "fastify";
import getData from "./getData";

const app = Fastify();

let intervalDuration = 120000;
if (process.env.INTERVAL) {
	const newDuration = parseInt(process.env.INTERVAL);
	if (!isNaN(newDuration)) intervalDuration = newDuration;
}

let data: any[] = [];

getData().then((d) => {
	data = d;
});
setInterval(() => {
	getData().then((d) => {
		data = d;
	});
}, intervalDuration);

app.get("/", (_, res) => {
	res.send({ ok: true, data });
});

app.listen(8000, "0.0.0.0", (err, address) => {
	if (err) throw err;
	console.log(`server listening on ${address}`);
});
