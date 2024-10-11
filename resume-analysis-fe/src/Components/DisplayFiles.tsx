import axios from 'axios'
import React, { useEffect, useState } from 'react'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FileOpenIcon from '@mui/icons-material/FileOpenOutlined';
import { Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface ResumeType {
  id: string;
  name: string;
  summary: string;
  file_name: string;
}

const DisplayFiles = () => {
  const token = sessionStorage.getItem('token')
  const [resumes, setResumes] = useState<ResumeType[]>()
  const [loading, setLoading] = useState<boolean>(true)
  const handleOpenFile = async (file_name: string) => {
    try {
      const response = await axios.get('http://localhost:8000/file/resume?filename=' + file_name, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        responseType: 'blob'
      }
      )
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url)
    } catch {
      console.log('error')
    }
  }

  useEffect(() => {
    setLoading(true)
    const fetchResumes = async () => {
      const response = await axios.get('http://localhost:8000/api/resumes', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
      })
      setResumes(response.data)
    }
    fetchResumes().catch(console.error).finally(() => { setLoading(false) })
  }, [])

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh' // Full height for central alignment
        }}
      >
        <CircularProgress size={100} /> {/* Large circular progress */}
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: '64px', width: '90%', position: 'absolute', left: '50%', transform: 'translate(-50%, 0%)' }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead sx={{ backgroundColor: '#282c34' }}>
          <TableRow>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">ID</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Summary</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Resume</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {resumes && (resumes.map((row) => (
            <TableRow
              key={row.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.id}</TableCell>
              <TableCell align="left">{row.summary}</TableCell>
              <TableCell align="right"><Button onClick={() => { handleOpenFile(row.file_name) }}><FileOpenIcon /></Button></TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DisplayFiles;