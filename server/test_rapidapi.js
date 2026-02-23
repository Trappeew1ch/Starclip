import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const videoId = '7607053587209850132';
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';

    console.log(`🚀 Fetching stats from RapidAPI for ID: ${videoId}`);

    try {
        const response = await axios.get(`https://${apiHost}/api/post/detail`, {
            params: { videoId },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        });

        console.log('Response Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error('API Error:', e.response ? e.response.data : e.message);
    }
}
run();
