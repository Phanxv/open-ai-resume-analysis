import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Container, Typography, List, ListItem, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios, { AxiosError } from 'axios';
import "./Styles.css"

const FileUpload: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>()
    const token = sessionStorage.getItem('token');
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    }, []);

    const handleUpload = async () => {
        setLoading(true)
        setError('')
        if (selectedFiles.length === 0) return;

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        try {
            const response = await axios.post('http://localhost:8000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token
                },
            });

            setUploadedFiles(selectedFiles);
            setSelectedFiles([]);
            console.log('Upload successful:', response.data);
        } catch (error) {
            console.error('Upload failed:', error);
            setError('Error occurs during upload or indexing precess')
        } finally {
            setLoading(false)
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'application/pdf': ['.pdf'],
        },
    });

    return (
        <div className="App">
            <header className="App-header">
                <div className="component-left">
                    <Container maxWidth="sm" sx={{ mt: 5, marginTop: 20 }}>
                        <Box
                            {...getRootProps()}
                            sx={{
                                p: 4,
                                border: '2px dashed #ccc',
                                borderRadius: 2,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'border-color 0.3s',
                                backgroundColor: 'inherit',
                                '&:hover': { borderColor: '#fefefe' },
                            }}
                        >
                            <input {...getInputProps()} />
                            <CloudUploadIcon sx={{ fontSize: 48, color: '#fff' }} />
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                {isDragActive ? 'Drop the PDF files in this area...' : 'Drag and drop PDF files or click to select'}
                            </Typography>

                            {selectedFiles.length > 0 && (
                                <Box sx={{ mt: 2, textAlign: 'left' }}>
                                    <Typography variant="body1">Selected Files:</Typography>
                                    <List>
                                        {selectedFiles.map((file) => (
                                            <ListItem key={file.name} sx={{ fontSize: '16px' }}>
                                                {file.name}
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {uploadedFiles.length > 0 && (
                                <Box sx={{ mt: 2, textAlign: 'left' }}>
                                    <Typography variant="body1">Uploaded Files:</Typography>
                                    <List>
                                        {uploadedFiles.map((file) => (
                                            <ListItem key={file.name} sx={{ fontSize: '16px' }}>
                                                {file.name}
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </Box>
                        {selectedFiles.length > 0 && (
                            <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleUpload} 
                            disabled={loading}
                            sx={{ mt: 2 }}
                            >
                                Upload index
                            </Button>
                        )}
                        {error && (
                            <Typography color='error' marginTop={"10px"}>{error}</Typography>
                        )}
                        {loading && (
                            <CircularProgress
                                size={50}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-25px',
                                    marginLeft: '-25px',
                                }}
                            />
                        )}
                    </Container>
                </div>
            </header>
        </div>
    );
};

export default FileUpload;
