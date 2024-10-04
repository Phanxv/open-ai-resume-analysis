import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Container } from '@mui/material';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import "./Styles.css"
import ResultCard from './ResultCard';
import axios from 'axios';

const SearchField: React.FC = () => {
    const [query, setQuery] = useState<string>('');
    //const [responseChunks, setResponseChunks] = useState<any>();
    const [result, setResult] = useState<any[]>()
    const [showCard, setShowCard] = useState<boolean>(false)
    const token = sessionStorage.getItem('token');
    const handleSearch = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/search?query=' + query, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token
                },
            });
            setResult(response.data)
            setShowCard(true)
            console.log('Search result :', response.data);
        } catch (error) {
            console.error('Search failed:', error);
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
        <div className="App">
            <header className="App-header">
                <div className='component-left'>
                    <Container maxWidth="sm" sx={{ mt: 5, marginTop: 15}}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                p: 3,
                                boxShadow: 3,
                                borderRadius: 2,
                                backgroundColor: 'white'
                            }}
                        >
                            <Typography variant="h5" component="div" color='#282c34' fontWeight={"Bold"} gutterBottom>
                                Candidate Search
                            </Typography>
                            <TextField
                                label="Enter job requirement"
                                variant="outlined"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                fullWidth
                                multiline
                                rows={5}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSearch}
                                sx={{ mt: 2 }}
                            >
                                <PersonSearchIcon />
                            </Button>
                        </Box>
                    </Container>
                </div>
                {result && (
                    <div className={`component-right ${showCard ? 'show' : ''}`}>
                        {result.map((item, index) => (
                            <ResultCard
                                key={index}
                                score={item.score}
                                name={item.name}
                                summary={item.summary}
                            />
                        ))}
                    </div>
                )}
            </header>
        </div>
    );
};

export default SearchField;
