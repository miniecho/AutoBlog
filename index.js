import express from "express";
import * as dotenv from "dotenv";
import fetch from "node-fetch";
import textract from "textract";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import xml2js from "xml2js";

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

		res.status(200).send(blogPost.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
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

		res.status(200).send(blogPost.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
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

		res.status(200).send(blogPost.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
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

		res.status(200).send(blogPostTL.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.get("/pubmed", async (req, res) => {
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
		// Construct the efetch URL
		const efetchURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${userURL}&retmode=xml`;

		// Fetch XML response from efetch endpoint
		const response = await fetch(efetchURL);
		if (!response.ok) {
			res.status(200).send("<h1>Failed to fetch XML from PubMed</h1>");
		}
		const xml = await response.text();

		// Parse XML to JSON
		const parser = new xml2js.Parser();
		const result = await parser.parseStringPromise(xml);

		// Extract AbstractText
		const abstractText =
			result.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]
				.Abstract[0].AbstractText[0]._;

		// Define the prompt chain
		const promptChain = `# IDENTITY and PURPOSE

You are an expert content summarizer. You take content in and output a Markdown formatted summary using the format below.

Take a deep breath and think step by step about how to best accomplish this goal using the following steps.

# OUTPUT SECTIONS

- Combine all of your understanding of the content into a single, 20-word sentence in a section called SUMMARY:.
- Output the 10 most important points of the content as a list with no more than 15 words per point into a section called KEY FINDINGS:.
- Output a list of the 5 best takeaways from the content in a section called CONCLUSION:.
- Output a list keywords that illustrate a suitable stock image for this content. Keywords should be put in a single line separated by comma, and be put under a section called KEYWORDS:.

# OUTPUT INSTRUCTIONS

- Create the output using the formatting above.
- Use Markdown's heaading 2 (##) for section titles.
- You only output human readable Markdown.
- Output numbered lists, not bullets.
- Do not output warnings or notes—just the requested sections.
- Do not repeat items in the output sections.
- Do not start items with the same opening words.

Ensure you follow ALL these instructions when creating your output.

# INPUT

INPUT:`;

		// Create post data
		const postData = JSON.stringify({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: promptChain,
				},
				{
					role: "user",
					content: abstractText,
				},
			],
			temperature: 0.3,
			user: "AutoBlog Test",
		});

		// Fetch completion from OpenAI
		const openAIResponse = await fetch(
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

		if (!openAIResponse.ok) {
			res.status(200).send("Failed to fetch from OpenAI");
		}

		const openAIResult = await openAIResponse.json();

		let blogPost = "";

		if (
			openAIResult.choices &&
			openAIResult.choices[0] &&
			openAIResult.choices[0].message
		) {
			blogPost = openAIResult.choices[0].message.content.trim();
		} else {
			console.error("Unexpected response structure", openAIResult);
			return res.status(500).json({ error: "Unexpected response from OpenAI" });
		}

		// Send Markdown response
		res.status(200).send(blogPost.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
	} catch (error) {
		console.error("Error fetching or processing data:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/summary", async (req, res) => {
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

You are an expert content summarizer. You take content in and output a Markdown formatted summary using the format below.

Take a deep breath and think step by step about how to best accomplish this goal using the following steps.

# OUTPUT SECTIONS

- Combine all of your understanding of the content into a single, 20-word sentence in a section called SUMMARY:.
- Output the 10 most important points of the content as a list with no more than 15 words per point into a section called KEY FINDINGS:.
- Output a list of the 5 best takeaways from the content in a section called CONCLUSION:.
- Output a list keywords that illustrate a suitable stock image for this content. Keywords should be put in a single line separated by comma, and be put under a section called KEYWORDS:.

# OUTPUT INSTRUCTIONS

- Create the output using the formatting above.
- Use Markdown's heaading 2 (##) for section titles.
- You only output human readable Markdown.
- Output numbered lists, not bullets.
- Do not output warnings or notes—just the requested sections.
- Do not repeat items in the output sections.
- Do not start items with the same opening words.

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

		res.status(200).send(blogPost.replace(/(.+)(\n|$)/g, "$1<br /><br />"));
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
