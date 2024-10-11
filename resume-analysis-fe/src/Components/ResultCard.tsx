import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import FileOpenIcon from '@mui/icons-material/FileOpenOutlined';
import axios from 'axios';

interface CandidateProps {
  name: string,
  id: string,
  summary: string,
  score: string
  file_name: string
}

const ResultCard = (props: CandidateProps) => {
  const [showLearnMore, setLearnMore] = useState<boolean>(false);
  const summary_cleaned_str = props.summary.replace(/```json\s*/g, '').replace(/\s*```/g, '');
  const summary_json_obj = JSON.parse(summary_cleaned_str)
  const token = sessionStorage.getItem('token')

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
      const url = window.URL.createObjectURL(new Blob([response.data], {type: 'application/pdf'}));
      window.open(url)
    } catch {
      console.log('error')
    }
  }

  return (
    <Card sx={{ minWidth: 275, mt: 2 }}>
      <CardContent>
        <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
          Candidate
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div">
            {props.name} ({props.id})
          </Typography>
          <Button onClick={() => {handleOpenFile(props.file_name)}}><FileOpenIcon /></Button>
        </Box>
        <Typography sx={{ color: 'text.secondary', mb: 1.0 }}>Score</Typography>
        <Typography variant="body2" sx={{ mb: 1}}>
          {props.score}
          <br />
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 1.0 }}>Summary</Typography>
        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Conclusion</Typography>
        <Typography variant="body2" sx={{ mb: 1}}>
          {summary_json_obj['conclusion']}
          <br />
        </Typography>
        <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Verdict</Typography>
        <Typography variant="body2" sx={{ mb: 1}}>
          {summary_json_obj['verdict']}
          <br />
        </Typography>
        {showLearnMore && (<>
          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Evaluation</Typography>
          <Typography variant="body2" sx={{ mb: 1}}>
            {summary_json_obj['evaluation']}
            <br />
          </Typography>
          </>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={ () => setLearnMore(!showLearnMore)}>{ showLearnMore ? 'Show less' : 'Show more'}</Button>
      </CardActions>
    </Card>
  );
}

export default ResultCard;
