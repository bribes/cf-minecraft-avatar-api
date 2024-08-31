import { Hono } from 'hono'
import { PhotonImage, SamplingFilter, crop, resize, blend } from "@cf-wasm/photon";

const app = new Hono();

app.get('/', (c) => {
	return c.html(`Made by <a href="https://github.com/bribes" target="_blank">Faav</a>
		<br>
		<br>
		textureId is from textures.minecraft.net
		<br>
		Endpoints:
		<br>
		/cape/:textureId
		<br>
		/head/:textureId
		<br>
		<br>
		Powered by Cloudflare Workers
		`)
})

app.get('/cape/:textureId', async (c) => {
	try {
		const textureId = c.req.param('textureId');
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);

		const inputBytes = await fetch(imageUrl)
			.then((res) => res.arrayBuffer())
			.then((buffer) => new Uint8Array(buffer))

		const inputImage = PhotonImage.new_from_byteslice(inputBytes);

		const croppedImage = crop(
			inputImage,
			1,
			1,
			11,
			17
		);

		const outputImage = resize(
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
	} catch {
		c.status(500)
		return c.json({ error: true })
	}
})

app.get('/head/:textureId', async (c) => {
	try {
		const textureId = c.req.param('textureId');
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);

		const inputBytes = await fetch(imageUrl)
			.then((res) => res.arrayBuffer())
			.then((buffer) => new Uint8Array(buffer))

		const inputImage = PhotonImage.new_from_byteslice(inputBytes);

		const croppedImage1 = crop(
			inputImage,
			8,
			8,
			16,
			16
		);

		const croppedImage2 = crop(
			inputImage,
			40,
			8,
			48,
			16
		);

		const outputImage1 = resize(
			croppedImage1,
			64,
			64,
			SamplingFilter.Nearest
		)

		const outputImage2 = resize(
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

		const outputBytes = outputImage1.get_bytes();

		inputImage.free();
		croppedImage1.free();
		croppedImage2.free();
		outputImage1.free();
		outputImage2.free();

		return c.body(outputBytes)
	} catch {
		c.status(500)
		return c.json({ error: true })
	}
})

export default app