import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, List, ListItem } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import "./DragDropFileUpload.css"

const FileUpload: React.FC = () => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const token = sessionStorage.getItem('token');
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    }, []);

    const handleUpload = async () => {
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
                <Box
                    {...getRootProps()}
                    sx={{
                        p: 4,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s',
                        backgroundColor: isDragActive ? '#f0f0f0' : 'inherit',
                        '&:hover': { borderColor: '#fefefe' },
                    }}
                >
                    <input {...getInputProps()} />
                    <CloudUploadIcon sx={{ fontSize: 48, color: '#888' }} />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        {isDragActive ? 'Drop the PDF files here...' : 'Drag and drop PDF files or click to select'}
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
                    <Button variant="contained" color="primary" onClick={handleUpload} sx={{ mt: 2 }}>
                        Upload
                    </Button>
                )}
            </header>
        </div>
    );
};

export default FileUpload;
