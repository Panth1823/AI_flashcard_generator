export default {
	async fetch(request, env) {
		// Handle preflight OPTIONS requests for CORS
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		if (request.method === 'POST') {
			try {
				const { quiz } = await request.json();

				// Validate input: Prevent number-only prompts
				if (/^\d+$/.test(quiz)) {
					return new Response(JSON.stringify({ error: 'Prompt cannot be a number only.' }), {
						status: 400,
						headers: { 'Access-Control-Allow-Origin': '*' },
					});
				}

				// Construct the AI prompt
				const prompt = `Generate 6 flashcards for the topic "${quiz}". Each flashcard should be in JSON format like:
				{
 				"id": 1,
  				"question": "What is the question?",
 				"answer": "The answer"
				}
				Please provide only the JSON data without any additional text or explanations.`;

				// Call the AI model
				const aiResponse = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.1', {
					prompt,
					raw: true,
					stream: false,
				});

				const responseText = aiResponse.response.trim();
				console.log('AI Response:', responseText);

				// Attempt to parse the response as JSON
				let flashcardsData;
				try {
					flashcardsData = JSON.parse(responseText);
				} catch (jsonError) {
					throw new Error('Response does not contain valid JSON.');
				}

				if (!Array.isArray(flashcardsData)) {
					throw new Error('Response JSON is not an array.');
				}

				return new Response(JSON.stringify(flashcardsData), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				});
			} catch (error) {
				console.error('Request Handling Error:', error);
				return new Response(JSON.stringify({ error: error.message }), {
					status: 500,
					headers: { 'Access-Control-Allow-Origin': '*' },
				});
			}
		}

		return new Response('Invalid request method.', {
			status: 405,
			headers: { 'Access-Control-Allow-Origin': '*' },
		});
	},
};
