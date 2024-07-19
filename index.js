import express from "express";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import textract from "textract";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import cookieParser from "cookie-parser";

dotenv.config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 3000;

// Convert import.meta.url to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse JSON and Cookies
app.use(express.json());
app.use(cookieParser());

// Route to handle URL-based blog generation
app.get("/short", async (req, res) => {
	const userURL = req.query.url;

	if (!userURL) {
		return res.status(400).json({ error: "URL parameter is required" });
	}

	if (!req.cookies || !req.cookies.OPENAI_KEY) {
		return res
			.status(200)
			.send("<h1>You don't have an API key in your cookie!</h1>");
	}

	try {
		let blogPost = "";

		// Scrape webpage
		const urlContent = await new Promise((resolve, reject) => {
			textract.fromUrl(userURL, (error, text) => {
				if (error) {
					reject(error);
				} else {
					resolve(text);
				}
			});
		});

		const promptChain = `# IDENTITY and PURPOSE

You are an expert development blog article writer specializing in webapps, Software-as-a-Service, Artificial Intelligence, and other online services. Your task is to analyze the HTML code or a raw text of a website provided by a user to write an in-depth article about the website and its services. The article must be structured in markdown format, encapsulated within a code block. Commencing with a captivating title, the article should include an introductory paragraph, followed by build-up sections with placeholders for images and their descriptions suitable for the subsequent content (image description must be conscise and long enough for AI image generation). The build-up section should contain at least thrice or more topics based on the topics discovered. Finally, you will conclude the article with a call-to-action, inviting users to subscribe to IxTJ Blog for more insightful content like the present article. Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Begin by reviewing the HTML code or raw text of a website provided by the user.
- Draft an enticing title for the article.
- Compose an introductory paragraph to set the context for the article.
- Insert placeholders for suitable images and their corresponding descriptions.
- Present your findings about the website

# OUTPUT INSTRUCTIONS

- The article part must be formatted in markdown.
- Use "#" for title of the article.
- Use "##" for the section.
- Use "###" for sub-sections.
- Only output the article. Do not add explanations for the article.

Ensure you follow ALL these instructions when creating your output.

# INPUT

INPUT:`;

		const postData = JSON.stringify({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: promptChain,
				},
				{
					role: "user",
					content: urlContent,
				},
			],
			temperature: 0.3,
			user: "AutoBlog Test",
		});

		try {
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
				},
				body: postData,
			});

			const resExtract = await response.json();

			if (
				resExtract.choices &&
				resExtract.choices[0] &&
				resExtract.choices[0].message
			) {
				blogPost += "\n" + resExtract.choices[0].message.content.trim();
			} else {
				console.error("Unexpected response structure", resExtract);
			}
		} catch (error) {
			console.error(error);
		}

		res.status(200).send(marked(blogPost));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/long", async (req, res) => {
	const userURL = req.query.url;

	if (!userURL) {
		return res.status(400).json({ error: "URL parameter is required" });
	}

	if (!req.cookies || !req.cookies.OPENAI_KEY) {
		return res
			.status(200)
			.send("<h1>You don't have an API key in your cookie!</h1>");
	}

	try {
		let blogPost = "";

		// Scrape webpage
		const urlContent = await new Promise((resolve, reject) => {
			textract.fromUrl(userURL, (error, text) => {
				if (error) {
					reject(error);
				} else {
					resolve(text);
				}
			});
		});

		// Blog builder prompts
		const prompts = [
			{
				section: "Introduction",
				sub1: "Purpose of the Article",
				sub2: "Target Audience",
				sub3: "Brief Overview",
			},
			{
				section: "Background",
				sub1: "Context and Problem Statement",
				sub2: "Relevance and Importance",
				sub3: "Related Work",
			},
			{
				section: "Problem Definition",
				sub1: "Detailed Problem Description",
				sub2: "Why It Matters",
				sub3: "Impact on Users or Systems",
			},
			{
				section: "Solution Overview",
				sub1: "Approach and Strategy",
				sub2: "Key Features and Components",
				sub3: "Benefits and Advantages",
			},
			{
				section: "Challenges and Considerations",
				sub1: "Common Pitfalls",
				sub2: "Performance and Optimization",
				sub3: "Security Concerns",
			},
			{
				section: "Conclusion",
				sub1: "Summary of Key Points",
				sub2: "Lessons Learned",
				sub3: "Future Work and Improvements",
			},
			{
				section: "Call to Action",
				sub1: "Questions for the Readers",
				sub2: "Share and Comment",
				sub3: "Subscribe to IxTJ.dev blog",
			},
		];

		for (const prompt of prompts) {
			const promptChain = `# IDENTITY and PURPOSE

You are an expert development blog article writer specializing in webapps, Software-as-a-Service, Artificial Intelligence, and other online services. Your task is to analyze the HTML code or a raw text of a website provided by a user to write a specific part of an in-depth article about the website and its services. In your writing, insert sections with placeholders for images and their descriptions suitable for the subsequent content (image description must be conscise and long enough for AI image generation). The article part must be structured in markdown format.

You are required to write the "${prompt.section}" section of the article, which should include the following sub-sections:
- ${prompt.sub1}
- ${prompt.sub2}
- ${prompt.sub3}

Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Begin by reviewing the HTML code or raw text of a website provided by the user.
- Compose an ${prompt.section} paragraph to set the context for the article.
- Include the sub-sections: "${prompt.sub1}", "${prompt.sub2}", and "${prompt.sub3}".
- Insert placeholders for suitable images and their corresponding descriptions.

# OUTPUT INSTRUCTIONS

- The article part must be formatted in markdown.
- Use "##" for the section.
- Use "###" for sub-sections.
- Only output the article. Do not add explanations for the article.

Ensure you follow ALL these instructions when creating your output.

# INPUT

INPUT:`;

			const postData = JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: promptChain,
					},
					{
						role: "user",
						content: urlContent,
					},
				],
				temperature: 0.3,
				user: "AutoBlog Test",
			});

			try {
				const response = await fetch("https://api.openai.com/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
					},
					body: postData,
				});

				const resExtract = await response.json();

				if (
					resExtract.choices &&
					resExtract.choices[0] &&
					resExtract.choices[0].message
				) {
					blogPost += "\n" + resExtract.choices[0].message.content.trim();
				} else {
					console.error("Unexpected response structure", resExtract);
				}
			} catch (error) {
				console.error(error);
			}
		}

		res.status(200).send(marked(blogPost));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/short_ko", async (req, res) => {
	const userURL = req.query.url;

	if (!userURL) {
		return res.status(400).json({ error: "URL parameter is required" });
	}

	if (!req.cookies || !req.cookies.OPENAI_KEY) {
		return res
			.status(200)
			.send("<h1>You don't have an API key in your cookie!</h1>");
	}

	try {
		let blogPost = "";

		// Scrape webpage
		const urlContent = await new Promise((resolve, reject) => {
			textract.fromUrl(userURL, (error, text) => {
				if (error) {
					reject(error);
				} else {
					resolve(text);
				}
			});
		});

		const promptChain = `# IDENTITY and PURPOSE

You are an expert development blog article writer specializing in webapps, Software-as-a-Service, Artificial Intelligence, and other online services. Your task is to analyze the HTML code or a raw text of a website provided by a user to write an in-depth article about the website and its services. The article must be structured in markdown format, encapsulated within a code block. Commencing with a captivating title, the article should include an introductory paragraph, followed by build-up sections with placeholders for images and their descriptions suitable for the subsequent content (image description must be conscise and long enough for AI image generation). The build-up section should contain at least thrice or more topics based on the topics discovered. Finally, you will conclude the article with a call-to-action, inviting users to subscribe to IxTJ Blog for more insightful content like the present article. Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Begin by reviewing the HTML code or raw text of a website provided by the user.
- Draft an enticing title for the article.
- Compose an introductory paragraph to set the context for the article.
- Insert placeholders for suitable images and their corresponding descriptions.
- Present your findings about the website

# OUTPUT INSTRUCTIONS

- The article part must be formatted in markdown.
- Use "#" for title of the article.
- Use "##" for the section.
- Use "###" for sub-sections.
- Only output the article. Do not add explanations for the article.

Ensure you follow ALL these instructions when creating your output.

# INPUT

INPUT:`;

		const postData = JSON.stringify({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: promptChain,
				},
				{
					role: "user",
					content: urlContent,
				},
			],
			temperature: 0.3,
			user: "AutoBlog Test",
		});

		try {
			const response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
				},
				body: postData,
			});

			const resExtract = await response.json();

			if (
				resExtract.choices &&
				resExtract.choices[0] &&
				resExtract.choices[0].message
			) {
				const postData = JSON.stringify({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content:
								"Translate the following blog article into Korean. Do not alter formatting.",
						},
						{
							role: "user",
							content: resExtract.choices[0].message.content.trim(),
						},
					],
					temperature: 0.3,
					user: "AutoBlog Test",
				});

				try {
					const responseOpenAI = await fetch(
						"https://api.openai.com/v1/chat/completions",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
							},
							body: postData,
						}
					);

					const resExtractOpenAI = await responseOpenAI.json();

					if (
						resExtractOpenAI.choices &&
						resExtractOpenAI.choices[0] &&
						resExtractOpenAI.choices[0].message
					) {
						blogPost = resExtractOpenAI.choices[0].message.content.trim();
					} else {
						console.error("Unexpected response structure", resExtractOpenAI);
					}
				} catch (error) {
					console.error(error);
				}
			} else {
				console.error("Unexpected response structure", resExtract);
			}
		} catch (error) {
			console.error(error);
		}

		res.status(200).send(marked(blogPost));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/long_ko", async (req, res) => {
	const userURL = req.query.url;

	if (!userURL) {
		return res.status(400).json({ error: "URL parameter is required" });
	}

	if (!req.cookies || !req.cookies.OPENAI_KEY) {
		return res
			.status(200)
			.send("<h1>You don't have an API key in your cookie!</h1>");
	}

	try {
		let blogPost = "";

		// Scrape webpage
		const urlContent = await new Promise((resolve, reject) => {
			textract.fromUrl(userURL, (error, text) => {
				if (error) {
					reject(error);
				} else {
					resolve(text);
				}
			});
		});

		// Blog builder prompts
		const prompts = [
			{
				section: "Introduction",
				sub1: "Purpose of the Article",
				sub2: "Target Audience",
				sub3: "Brief Overview",
			},
			{
				section: "Background",
				sub1: "Context and Problem Statement",
				sub2: "Relevance and Importance",
				sub3: "Related Work",
			},
			{
				section: "Problem Definition",
				sub1: "Detailed Problem Description",
				sub2: "Why It Matters",
				sub3: "Impact on Users or Systems",
			},
			{
				section: "Solution Overview",
				sub1: "Approach and Strategy",
				sub2: "Key Features and Components",
				sub3: "Benefits and Advantages",
			},
			{
				section: "Challenges and Considerations",
				sub1: "Common Pitfalls",
				sub2: "Performance and Optimization",
				sub3: "Security Concerns",
			},
			{
				section: "Conclusion",
				sub1: "Summary of Key Points",
				sub2: "Lessons Learned",
				sub3: "Future Work and Improvements",
			},
			{
				section: "Call to Action",
				sub1: "Questions for the Readers",
				sub2: "Share and Comment",
				sub3: "Subscribe to IxTJ.dev blog",
			},
		];

		for (const prompt of prompts) {
			const promptChain = `# IDENTITY and PURPOSE

You are an expert development blog article writer specializing in webapps, Software-as-a-Service, Artificial Intelligence, and other online services. Your task is to analyze the HTML code or a raw text of a website provided by a user to write a specific part of an in-depth article about the website and its services. In your writing, insert sections with placeholders for images and their descriptions suitable for the subsequent content (image description must be conscise and long enough for AI image generation). The article part must be structured in markdown format.

You are required to write the "${prompt.section}" section of the article, which should include the following sub-sections:
- ${prompt.sub1}
- ${prompt.sub2}
- ${prompt.sub3}

Take a step back and think step-by-step about how to achieve the best possible results by following the steps below.

# STEPS

- Begin by reviewing the HTML code or raw text of a website provided by the user.
- Compose an ${prompt.section} paragraph to set the context for the article.
- Include the sub-sections: "${prompt.sub1}", "${prompt.sub2}", and "${prompt.sub3}".
- Insert placeholders for suitable images and their corresponding descriptions.

# OUTPUT INSTRUCTIONS

- The article part must be formatted in markdown.
- Use "##" for the section.
- Use "###" for sub-sections.
- Only output the article. Do not add explanations for the article.

Ensure you follow ALL these instructions when creating your output.

# INPUT

INPUT:`;

			const postData = JSON.stringify({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "system",
						content: promptChain,
					},
					{
						role: "user",
						content: urlContent,
					},
				],
				temperature: 0.3,
				user: "AutoBlog Test",
			});

			try {
				const response = await fetch("https://api.openai.com/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
					},
					body: postData,
				});

				const resExtract = await response.json();

				if (
					resExtract.choices &&
					resExtract.choices[0] &&
					resExtract.choices[0].message
				) {
					blogPost += "\n" + resExtract.choices[0].message.content.trim();
				} else {
					console.error("Unexpected response structure", resExtract);
				}
			} catch (error) {
				console.error(error);
			}

		}
		
		let blogPostTL = "";
		const postData = JSON.stringify({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"Translate the following blog article into Korean. Do not alter formatting.",
				},
				{
					role: "user",
					content: blogPost,
				},
			],
			temperature: 0.3,
			user: "AutoBlog Test",
		});

		try {
			const responseOpenAI = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${req.cookies.OPENAI_KEY}`,
					},
					body: postData,
				}
			);

			const resExtractOpenAI = await responseOpenAI.json();

			if (
				resExtractOpenAI.choices &&
				resExtractOpenAI.choices[0] &&
				resExtractOpenAI.choices[0].message
			) {
				blogPostTL = resExtractOpenAI.choices[0].message.content.trim();
			} else {
				console.error("Unexpected response structure", resExtractOpenAI);
			}
		} catch (error) {
			console.error(error);
		}

		res.status(200).send(marked(blogPostTL));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
