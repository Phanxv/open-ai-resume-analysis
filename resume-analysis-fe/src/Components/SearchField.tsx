import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Container, LinearProgress } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import "./SearchComponentStyle.css"
import ResultCard from './ResultCard';
import LanguageSelection from './LanguageSelection';
import axios from 'axios';

interface DataItem {
    file_name: string;
    content: string;
    id: string;
    score: number;
    name: string;
    summary: string; // This will hold the JSON string
  }
  
  interface Summary {
    evaluation: string;
    conclusion: string;
    verdict: string;
    rating: number;
  }

const SearchField: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    //const [responseChunks, setResponseChunks] = useState<any>();
    const [result, setResult] = useState<DataItem[]>()
    const [sortedData, setSortedData] = useState<DataItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>()
    const [language, setLanguage] = useState<string>('')
    const token = sessionStorage.getItem('token');

    useEffect(() => {
        if (!result) {return}
        const sorted = result.sort((a, b) => {
          // Parse summary string into an object
          const ratingA = (JSON.parse(a.summary.replace(/```json\s*/g, '').replace(/\s*```/g, '')) as Summary).rating;
          const ratingB = (JSON.parse(b.summary.replace(/```json\s*/g, '').replace(/\s*```/g, '')) as Summary).rating;
          return ratingB - ratingA; // Sort in descending order
        });
    
        setSortedData(sorted);
      }, [result]);

    const handleSearch = async () => {
        setError('')
        setLoading(true)
        try {
            const response = await axios.get('http://localhost:8000/api/search?query=' + query + '&lang=' + language, {
                headers: {
                    'Authorization': token
                },
            });
            if (response.status === 200) {
                setResult(response.data)
                console.log('Search result :', response.data);
            } else if (response.status === 204) {
                setError('Candidate that matches the requirement not found')
                console.log('Candidate not found')
            }

        } catch (error) {
            console.error('Search failed:', error);
            setError('Error occurs while searching index')
        } finally {
            setLoading(false)
        }
        /*
        const response = await fetch('http://localhost:8000/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"query" : query})
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let jsonChunks = [];
        setShowCard(true)
        if (reader) {
            let done = false;

            // Read the stream in chunks
            while (!done) {
                const { done: streamDone, value } = await reader.read();
                done = streamDone;

                // Decode the chunk and store it in the array
                if (value) {
                    console.log("chunk incoming...")
                    const chunkData = decoder.decode(value, { stream: !done });
                    jsonChunks.push(chunkData) // Append to the array
                    console.log(responseChunks)
                }
            }
        }
        setResponseChunks(jsonChunks)
        */
    };

    return (
        <Box className="app-container" sx={{ pt: '64px', backgroundColor: '#282c34' }}>
            {!result ? (
                // Initial view with centered search container
                <Container className="search-container" maxWidth="sm">
                    <Box sx={{ width: '100%', textAlign: 'left', padding: 2, border: '1px #000', backgroundColor: 'white', borderRadius: 2 }}>
                        <Typography variant="h5" component="div" color='#282c34' fontWeight={"Bold"} gutterBottom>
                            Candidate Search
                        </Typography>
                        <TextField
                            fullWidth
                            label="Enter job requirement to search for candidate"
                            variant="outlined"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            multiline
                            rows={7}
                            sx={{ marginBottom: 2 }}
                        />
                        <LanguageSelection language={language} setLanguage={setLanguage}></LanguageSelection>
                        {error && <Typography color='error' sx={{ pb: 2 }}>{error}</Typography>}
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            <PersonSearchIcon />
                        </Button>
                        {loading && <LinearProgress sx={{ marginTop: 2 }} />}
                    </Box>
                </Container>
            ) : (
                // View with search results, divided screen
                <Box className="content-container" sx={{ display: 'flex', height: 'calc(100vh - 50px)' }}>
                    <Box className="search-left" sx={{ flex: 1, padding: 2, position: 'sticky', top: '0' }}>
                        <Box className="search-box" sx={{ textAlign: 'left', padding: 2, border: '1px #000', backgroundColor: 'white', borderRadius: 2 }}>
                            <Typography variant="h5" component="div" color='#282c34' fontWeight={"Bold"} gutterBottom>
                                Candidate Search
                            </Typography>
                            <TextField
                                fullWidth
                                label="Enter job requirement to search for candidate"
                                variant="outlined"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                multiline
                                rows={7}
                                sx={{ marginBottom: 2 }}
                            />
                            <LanguageSelection language={language} setLanguage={setLanguage}></LanguageSelection>
                            {error && <Typography color='error'>{error}</Typography>}
                            <Button fullWidth variant="contained" onClick={handleSearch}>
                                <PersonSearchIcon />
                            </Button>
                            {loading && <LinearProgress sx={{ marginTop: 2 }} />}
                        </Box>
                    </Box>
                    <Box className="results-right" sx={{ flex: 1, pr: 2, overflowY: 'auto' }}>
                        {
                        sortedData
                            .map((item, index) => (
                                <ResultCard
                                    id={item.id}
                                    key={index}
                                    score={item.score}
                                    name={item.name}
                                    file_name={item.file_name}
                                    summary={item.summary}
                                />
                            ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default SearchField;
