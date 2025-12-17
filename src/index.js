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

		let body = parseContent(email.text, email.html) || 'NO BODY';

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
				'INSERT INTO gcfound_email (email, subject, content, html) VALUES(?,?,?,?)',
				[message.to, email.subject || 'NO SUBJECT', body, email.html || null]
			);

			ctx.waitUntil(connection.end());
		} catch (e) {
			console.error(e);
		}
	}
};
