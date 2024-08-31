import { Hono } from 'hono'
import { PhotonImage, SamplingFilter, crop, resize, blend, padding_uniform, Rgba } from "@cf-wasm/photon";

const app = new Hono();

app.get('/', (c) => {
	return c.html(`<h1>Cloudflare Minecraft Avatar API</h1>
		Made by <a href="https://github.com/bribes" target="_blank">Faav</a>
		<br>
		<br>
		The :textureId is from textures.minecraft.net.
		<br>
		<br>
		Endpoints:
		<br>
		/cape/:textureId/:width(?back)
		<br>
		Default Width: 80
		<br>
		<img src="/cape/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6">
		<br>
		<br>
		/face/:textureId/:size?(?nolayers)
		<br>
		Default Size: 64
		<br>
		<img src="/face/663904192ee4ca0df05dce2b2af677b3290db7311648b125fac140f616641dfa">
		<br>
		<br>
		On error, it returns a Error 404 status code with JSON data:
		<code>{"error":true}</code>
		<br>
		<br>
		<a href="https://github.com/bribes/cf-minecraft-avatar-api">GitHub Repository</a>
		<br>
		Powered by <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>, <a href="https://hono.dev/">Hono</a>, and <a href="https://github.com/fineshopdesign/cf-wasm">Photon</a> (CF WASM).
		`)
})

app.get('/cape/:textureId/:width?', async (c) => {
	try {
		var textureId = c.req.param('textureId');
		if (textureId.endsWith('.png')) textureId = textureId.split('.')[0];
		const back = typeof c.req.query('back') == 'string';
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);
		var width = c.req.param('width') ?? 80;

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
			width,
			width*1.6,
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

app.get('/face/:textureId/:size?', async (c) => {
	try {
		var textureId = c.req.param('textureId');
		if (textureId.endsWith('.png')) textureId = textureId.split('.')[0];
		const noLayers = typeof c.req.query('nolayers') == 'string';
		const imageUrl = "http://textures.minecraft.net/texture/" + encodeURIComponent(textureId);
		var size = c.req.param('size') ?? 64;

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

		if (!noLayers) {
			var outputImage1 = resize(
				croppedImage1,
				size-(size/9),
				size-(size/9),
				SamplingFilter.Nearest
			)

			var outputImage1 = padding_uniform(outputImage1, (size/9)/2, new Rgba(0, 0, 0, 1))

			var croppedImage2 = crop(
				inputImage,
				40,
				8,
				48,
				16
			);

			var outputImage2 = resize(
				croppedImage2,
				size,
				size,
				SamplingFilter.Nearest
			)

			blend(
				outputImage1,
				outputImage2,
				'over'
			)
		} else {
			var outputImage1 = resize(
				croppedImage1,
				size,
				size,
				SamplingFilter.Nearest
			)
		}

		const outputBytes = outputImage1.get_bytes();

		inputImage.free();
		croppedImage1.free();
		outputImage1.free();

		if (!noLayers) {
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