import { Hono } from 'hono'
import { PhotonImage, SamplingFilter, crop, resize, blend } from "@cf-wasm/photon";

const app = new Hono();

app.get('/', (c) => {
	return c.html(`Made by <a href="https://github.com/bribes" target="_blank">Faav</a>
		<br>
		<br>
		The :textureId is from textures.minecraft.net.
		<br>
		Endpoints:
		<br>
		/cape/:textureId(?back)
		<br>
		/head/:textureId(?nooverlay)
		<br>
		<br>
		On error, it returns a Error 404 status code with JSON data {"error":true}
		<br>
		<br>
		<a href="https://github.com/bribes/cf-minecraft-avatar-api">Github repo</a>
		<br>
		Powered by Cloudflare Workers, Hono, and Photon.
		`)
})

app.get('/cape/:textureId', async (c) => {
	try {
		const textureId = c.req.param('textureId');
		const back = typeof c.req.query('back') == 'string';
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);

		const inputBytes = await fetch(imageUrl)
			.then((res) => res.arrayBuffer())
			.then((buffer) => new Uint8Array(buffer))

		const inputImage = PhotonImage.new_from_byteslice(inputBytes);

		if (!back) {
			var croppedImage = crop(
				inputImage,
				1,
				1,
				11,
				17
			);
		} else {
			var croppedImage = crop(
				inputImage,
				12,
				1,
				22,
				17
			);
		}

		var outputImage = resize(
			croppedImage,
			80,
			128,
			SamplingFilter.Nearest
		)

		const outputBytes = outputImage.get_bytes();

		inputImage.free();
		croppedImage.free();
		outputImage.free();

		return c.body(outputBytes)
	} catch (e) {
		console.error(e)
		c.status(404)
		return c.json({ error: true })
	}
})

app.get('/head/:textureId', async (c) => {
	try {
		const textureId = c.req.param('textureId');
		const noOverlay = typeof c.req.query('nooverlay') == 'string';
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);

		const inputBytes = await fetch(imageUrl)
			.then((res) => res.arrayBuffer())
			.then((buffer) => new Uint8Array(buffer))

		const inputImage = PhotonImage.new_from_byteslice(inputBytes);

		var croppedImage1 = crop(
			inputImage,
			8,
			8,
			16,
			16
		);

		var outputImage1 = resize(
			croppedImage1,
			64,
			64,
			SamplingFilter.Nearest
		)

		if (!noOverlay) {
			var croppedImage2 = crop(
				inputImage,
				40,
				8,
				48,
				16
			);

			var outputImage2 = resize(
				croppedImage2,
				64,
				64,
				SamplingFilter.Nearest
			)

			blend(
				outputImage1,
				outputImage2,
				'over'
			)
		}

		const outputBytes = outputImage1.get_bytes();

		inputImage.free();
		croppedImage1.free();
		outputImage1.free();

		if (!noOverlay) {
			croppedImage2.free();
			outputImage2.free();
		}

		return c.body(outputBytes)
	} catch (e) {
		console.error(e)
		c.status(404)
		return c.json({ error: true })
	}
})

export default app