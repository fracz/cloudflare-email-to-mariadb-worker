import { createConnection } from 'mysql2/promise';
import PostalMime from "postal-mime";
import { convert } from "html-to-text";

const parseContent = (text, html) => {
	let body = text;
	if (!body && html) {
		body = convert(html);
	}
	if (!body) {
		return null;
	}
	return body.trim();
};

export default {
	async email(message, env, ctx) {

		const email = await PostalMime.parse(message.raw, {
			attachmentEncoding: "base64",
		});

		console.log({
			text: email.text,
			html: email.html
		});

		let body = parseContent(email.text, email.html);

		const connection = await createConnection({
			host: 'mws02.mikr.us',
			user: 'cloudflare_gc',
			password: env.MYSQL_PASS,
			database: 'geocaching',
			port: 50121,
			disableEval: true
		});

		try {
			await connection.execute(
				'INSERT INTO gcfound_email (subject, content) VALUES(?,?)',
				[email.subject, body]
			);

			ctx.waitUntil(connection.end());
		} catch (e) {
			console.error(e);
		}
	}
};
